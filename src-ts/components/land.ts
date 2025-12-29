import { system, world } from '@minecraft/server'
import { Position } from 'core/framework/common'
import { ParticleDrawer } from 'core/framework/particle'
import { Maybe } from 'src-ts/adt/maybe'
import { Component } from '../../core/framework/component'
import { Data, Database } from '../../core/framework/data'
import { SiriusCommandError } from '../../core/framework/error'
import { sendForm } from '../../core/framework/gui'
import { isOpPlayer, showVector3, toDim } from '../../core/framework/utils'

type Area = [Position, Position]

export class Land extends Component<SiriusPluginConfig['land']> {
  private createLandRunning: Map<string, { name: string; a?: Position; b?: Position }> = new Map()
  private locatedLandData: Map<string, Database['lands'][string][string]> = new Map()

  public setup() {
    this.landCommand()
    this.protectionEvents()
    this.visualizeAndLocationCheck()
  }

  private isPositionInArea(area: Area, pos: Position): boolean {
    if (area[0].dimension !== pos.dimension) return false
    const minX = Math.min(area[0].x, area[1].x),
      maxX = Math.max(area[0].x, area[1].x)
    const minY = Math.min(area[0].y, area[1].y),
      maxY = Math.max(area[0].y, area[1].y)
    const minZ = Math.min(area[0].z, area[1].z),
      maxZ = Math.max(area[0].z, area[1].z)
    return pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY && pos.z >= minZ && pos.z <= maxZ
  }

  private hasIntersection(area1: Area, area2: Area): boolean {
    if (area1[0].dimension !== area2[0].dimension) return false
    return !(
      area1[1].x < area2[0].x ||
      area1[0].x > area2[1].x ||
      area1[1].y < area2[0].y ||
      area1[0].y > area2[1].y ||
      area1[1].z < area2[0].z ||
      area1[0].z > area2[1].z
    )
  }

  private calculateBlockCount(area: Area): number {
    const [start, end] = area
    const dx = Math.abs(end.x - start.x) + 1
    const dy = Math.abs(end.y - start.y) + 1
    const dz = Math.abs(end.z - start.z) + 1
    return dx * dy * dz
  }

  private async getLocatedLand(pos: Position): Promise<Maybe<[string, string, Database['lands'][string][string]]>> {
    const allLands = await Data.get('lands')
    for (const owner in allLands) {
      for (const landName in allLands[owner]) {
        const land = allLands[owner][landName]
        if (this.isPositionInArea([land.start, land.end], pos)) return Maybe.Just([owner, landName, land])
      }
    }
    return Maybe.Nothing()
  }

  private protectionEvents() {
    this.before('playerBreakBlock', async (ev) => {
      const pl = ev.player
      ;(
        await this.getLocatedLand({
          x: ev.block.location.x,
          y: ev.block.location.y,
          z: ev.block.location.z,
          dimension: toDim(ev.dimension)
        })
      ).map(([owner, _, data]) => {
        if (owner !== pl.name && !data.allowlist.includes(pl.name) && !isOpPlayer(pl)) {
          ev.cancel = true
          pl.sendMessage('§c你没有权限在这里破坏方块！')
        }
        return null
      })
    })

    this.before('playerPlaceBlock', async (ev) => {
      const pl = ev.player
      ;(
        await this.getLocatedLand({
          x: ev.block.location.x,
          y: ev.block.location.y,
          z: ev.block.location.z,
          dimension: toDim(ev.dimension)
        })
      ).map(([owner, _, data]) => {
        if (owner !== pl.name && !data.allowlist.includes(pl.name) && !isOpPlayer(pl)) {
          ev.cancel = true
          pl.sendMessage('§c你没有权限在这里放置方块！')
        }
        return null
      })
    })

    this.before('playerInteractWithBlock', async (ev) => {
      const pl = ev.player
      ;(
        await this.getLocatedLand({
          x: ev.block.location.x,
          y: ev.block.location.y,
          z: ev.block.location.z,
          dimension: toDim(ev.block.dimension)
        })
      ).map(([owner, _, data]) => {
        if (owner !== pl.name && !data.allowlist.includes(pl.name) && !isOpPlayer(pl)) {
          ev.cancel = true
          pl.sendMessage('§c你没有权限在这里交互这个方块！')
        }
        return null
      })
    })

    this.before('itemUse', async (ev) => {
      const pl = ev.source
      ;(
        await this.getLocatedLand({
          x: ev.source.location.x,
          y: ev.source.location.y,
          z: ev.source.location.z,
          dimension: toDim(ev.source.dimension)
        })
      ).map(([owner, _, data]) => {
        if (owner !== pl.name && !data.allowlist.includes(pl.name) && !isOpPlayer(pl)) {
          ev.cancel = true
          pl.sendMessage('§c你没有权限在这里使用物品！')
        }
        return null
      })
    })
  }

  private visualizeAndLocationCheck() {
    this.before('playerLeave', async (ev) => this.createLandRunning.delete(ev.player.name))
    system.runInterval(async () => {
      for (const [name, info] of this.createLandRunning.entries()) {
        if (!info.a || !info.b) continue
        const pl = world.getAllPlayers().find((pl) => pl.name === name)
        if (!pl) continue
        new ParticleDrawer(pl, 'minecraft:villager_happy').drawCuboid(info.a, info.b)
      }

      for (const pl of world.getPlayers()) {
        const lastLand = this.locatedLandData.get(pl.name)

        ;(
          await this.getLocatedLand({
            x: pl.location.x,
            y: pl.location.y,
            z: pl.location.z,
            dimension: toDim(pl.dimension)
          })
        ).map((currentLand) => {
          pl.sendMessage(`当前所在领地: ${currentLand[1]} (主人: ${currentLand[0]})`)

          if (!lastLand) {
            const land = currentLand[2]
            if (land.welcomeMsg) pl.sendMessage(land.welcomeMsg)
            else pl.sendMessage(`欢迎进入 ${currentLand[1]} 的领地`)
            this.locatedLandData.set(pl.name, land)
          } else if (!currentLand && lastLand) {
            if (lastLand.leaveMsg) pl.sendMessage(lastLand.leaveMsg)
            else pl.sendMessage('你已离开领地')
            this.locatedLandData.delete(pl.name)
          }
          return null
        })
      }
    }, 10)
  }

  private landCommand() {
    this.cmd('land <action:String> [name:String]')
      .descr('领地管理: new, tp, set a/b, gui 等')
      .setup(async (pl, [action, name]) => {
        const allLands = await Data.get('lands')
        if (!(pl.name in allLands)) allLands[pl.name] = {}
        const lands = allLands[pl.name]
        switch (action) {
          case 'buy': {
            // 或 confirm
            if (!this.createLandRunning.has(pl.name)) return new SiriusCommandError('无创建进程')
            const info = this.createLandRunning.get(pl.name)!
            if (!info.a || !info.b) return new SiriusCommandError('两点未设置完整')
            const area: Area = [info.a, info.b]

            // 检查重叠
            for (const ownerLands of Object.values(allLands)) {
              for (const ld of Object.values(ownerLands)) {
                if (this.hasIntersection(area, [ld.start, ld.end])) {
                  return new SiriusCommandError('与现有领地重叠')
                }
              }
            }

            const blockCount = this.calculateBlockCount(area)
            if (blockCount > this.config.maxBlockCount)
              return new SiriusCommandError(`面积过大 (最大 ${this.config.maxBlockCount})`)

            const price = blockCount * this.config.buyPrice
            // TODO: money
            // if (money.get(pl.name) < price) return new SiriusCommandError(`余额不足: ${price}`)
            // money.reduce(pl.name, price)

            lands[info.name] = {
              start: info.a,
              end: info.b,
              allowlist: [],
              welcomeMsg: '',
              leaveMsg: ''
            }
            await Data.set('lands', allLands)
            this.createLandRunning.delete(pl.name)
            return `领地 ${info.name} 创建成功！花费 ${price}`
          }

          case 'giveup':
            this.createLandRunning.delete(pl.name)
            return '已放弃创建'

          case 'gui': {
            const buttons = Object.keys(lands).map((name) => ({
              text: name,
              action() {
                sendForm(pl, {
                  type: 'simple',
                  title: `管理 ${name}`,
                  buttons: [
                    { text: '传送', action: () => pl.runCommand(`land tp ${name}`) },
                    {
                      text: '添加白名单',
                      action: async () => {
                        /* dropdown @players */
                      }
                    },
                    {
                      text: '删除',
                      action: () => {
                        /* confirm */
                      }
                    }
                  ]
                })
              }
            }))
            sendForm(pl, {
              type: 'simple',
              title: '我的领地',
              buttons
            })
            return
          }
        }

        if (!name) {
          return new SiriusCommandError('缺少参数: name')
        }

        switch (action) {
          case 'tp': {
            if (!(name in lands)) return new SiriusCommandError('领地不存在')
            const land = lands[name]
            pl.teleport(
              { x: land.start.x, y: land.start.y, z: land.start.z },
              { dimension: world.getDimension(land.start.dimension) }
            )
            return `已传送到领地 ${name}`
          }

          case 'new': {
            if (this.createLandRunning.has(pl.name)) return new SiriusCommandError('已有创建进程')
            this.createLandRunning.set(pl.name, { name })
            pl.sendMessage('领地创建开始！用 /land set a 和 /land set b 设置两点')
            return
          }

          case 'set': {
            if (!this.createLandRunning.has(pl.name)) return new SiriusCommandError('无创建进程')
            const info = this.createLandRunning.get(pl.name)!
            const feetPos = {
              x: Math.floor(pl.location.x),
              y: Math.floor(pl.location.y),
              z: Math.floor(pl.location.z),
              dimension: toDim(pl.dimension)
            }
            if (name === 'a') info.a = feetPos
            else if (name === 'b') info.b = feetPos
            else return new SiriusCommandError('用法: /land set <a|b>')
            pl.sendMessage(`点 ${name} 已设置: ${showVector3(feetPos)}`)
            return
          }
        }
      })
  }
}
