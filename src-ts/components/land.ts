import { system, world } from '@minecraft/server'
import { Area, Position } from 'core/framework/common'
import { ParticleDrawer } from 'core/framework/particle'
import { Maybe } from 'src-ts/adt/maybe'
import { Component } from '../../core/framework/component'
import { Data, Database } from '../../core/framework/data'
import { SiriusCommandError } from '../../core/framework/error'
import { sendAdvancedModalForm, sendForm } from '../../core/framework/gui'
import {
  calculateBlockCount,
  getPlayerByName,
  hasIntersection,
  isOpPlayer,
  isPositionInArea,
  showVector3,
  toDim
} from '../../core/framework/utils'

export class Land extends Component<SiriusPluginConfig['land']> {
  private creatingLandProcess: Map<string, { name: string; a?: Position; b?: Position }> = new Map()
  private playerLocatedLands: Map<string, Database['lands'][string][string]> = new Map()
  private allLands: Database['lands'] = {}

  public setup() {
    this.landCommand()
    this.protectionEvents()
    this.visualizeAndLocationCheck()
  }

  private getLocatedLand(pos: Position): Maybe<[string, string, Database['lands'][string][string]]> {
    for (const owner in this.allLands) {
      for (const landName in this.allLands[owner]) {
        const land = this.allLands[owner][landName]
        if (isPositionInArea([land.start, land.end], pos)) return Maybe.Just([owner, landName, land])
      }
    }
    return Maybe.Nothing()
  }

  private protectionEvents() {
    system.runInterval(
      () =>
        Data.get('lands').then((lands) => {
          this.allLands = lands
        }),
      40
    )

    this.before('playerBreakBlock', (ev) => {
      this.getLocatedLand({
        x: ev.block.location.x,
        y: ev.block.location.y,
        z: ev.block.location.z,
        dimension: toDim(ev.dimension)
      }).map(([owner, _, data]) => {
        if (owner !== ev.player.name && !data.allowlist.includes(ev.player.name) && !isOpPlayer(ev.player)) {
          ev.cancel = true
          ev.player.sendMessage('§c你没有权限在这里破坏方块！')
        }
        return null
      })
    })

    this.before('playerPlaceBlock', (ev) => {
      this.getLocatedLand({
        x: ev.block.location.x,
        y: ev.block.location.y,
        z: ev.block.location.z,
        dimension: toDim(ev.dimension)
      }).map(([owner, _, data]) => {
        if (owner !== ev.player.name && !data.allowlist.includes(ev.player.name) && !isOpPlayer(ev.player)) {
          ev.cancel = true
          ev.player.sendMessage('§c你没有权限在这里放置方块！')
        }
        return null
      })
    })

    this.before('playerInteractWithBlock', (ev) => {
      this.getLocatedLand({
        x: ev.block.location.x,
        y: ev.block.location.y,
        z: ev.block.location.z,
        dimension: toDim(ev.block.dimension)
      }).map(([owner, _, data]) => {
        if (owner !== ev.player.name && !data.allowlist.includes(ev.player.name) && !isOpPlayer(ev.player)) {
          ev.cancel = true
          ev.player.sendMessage('§c你没有权限在这里交互这个方块！')
        }
        return null
      })
    })

    this.before('itemUse', (ev) => {
      this.getLocatedLand({
        x: ev.source.location.x,
        y: ev.source.location.y,
        z: ev.source.location.z,
        dimension: toDim(ev.source.dimension)
      }).map(([owner, _, data]) => {
        if (owner !== ev.source.name && !data.allowlist.includes(ev.source.name) && !isOpPlayer(ev.source)) {
          ev.cancel = true
          ev.source.sendMessage('§c你没有权限在这里使用物品！')
        }
        return null
      })
    })
  }

  private visualizeAndLocationCheck() {
    this.before('playerLeave', (ev) => this.creatingLandProcess.delete(ev.player.name))

    system.runInterval(() => {
      for (const [name, info] of this.creatingLandProcess.entries()) {
        if (!info.a || !info.b) continue
        getPlayerByName(name).map((pl) =>
          new ParticleDrawer(pl, 'minecraft:villager_happy').drawCuboid(info.a!, info.b!)
        )
      }

      for (const pl of world.getPlayers()) {
        const lastLand = this.playerLocatedLands.get(pl.name)

        this.getLocatedLand({
          x: pl.location.x,
          y: pl.location.y,
          z: pl.location.z,
          dimension: toDim(pl.dimension)
        }).match({
          Just: ([, name, land]) => {
            if (lastLand) return
            if (land.welcomeMsg) pl.sendMessage(land.welcomeMsg)
            else pl.sendMessage(`欢迎进入 ${name} 领地`)
            this.playerLocatedLands.set(pl.name, land)
          },
          Nothing: () => {
            if (!lastLand) return
            if (lastLand.leaveMsg) pl.sendMessage(lastLand.leaveMsg)
            else pl.sendMessage('你已离开领地')
            this.playerLocatedLands.delete(pl.name)
          }
        })
      }
    }, 10)
  }

  private landCommand() {
    this.enum('landAction', ['ls', 'buy', 'giveup', 'gui', 'tp', 'new', 'set', 'del', 'welcome', 'add', 'remove'])
    this.cmd('land <action:enum-landAction> [name:String] [msg:String]')
      .descr('Create a land or manage lands.')
      .setup(async (pl, [action, name, msg]) => {
        const allLands = await Data.get('lands')
        if (!(pl.name in allLands)) allLands[pl.name] = {}
        const lands = allLands[pl.name]
        switch (action) {
          case 'ls': {
            const list = Object.entries(allLands[pl.name]).map(([name, pos]) => `${name} (${showVector3(pos.start)})`)
            if (list.length === 0) return new SiriusCommandError('You have no lands.')
            return `Your lands:\n${list.join('\n')}`
          }
          case 'buy': {
            if (!this.creatingLandProcess.has(pl.name)) return new SiriusCommandError('No creating process.')
            const info = this.creatingLandProcess.get(pl.name)!
            if (!info.a || !info.b) return new SiriusCommandError('Two points not set.')
            const area: Area = [info.a, info.b]

            for (const ownerLands of Object.values(allLands)) {
              for (const ld of Object.values(ownerLands)) {
                if (hasIntersection(area, [ld.start, ld.end])) {
                  return new SiriusCommandError('Land already exists in this area.')
                }
              }
            }

            const blockCount = calculateBlockCount(area)
            if (blockCount > this.config.maxBlockCount)
              return new SiriusCommandError(`Land too large (Max block count: ${this.config.maxBlockCount})`)

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
            this.creatingLandProcess.delete(pl.name)
            return `Land ${info.name} created for ${blockCount} blocks, cost ${price} coins.`
          }
          case 'giveup': {
            this.creatingLandProcess.delete(pl.name)
            return 'has give up creating land.'
          }
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
                      action: () =>
                        sendForm(pl, {
                          type: 'custom',
                          title: `管理 ${name} - 添加白名单`,
                          elements: [{ type: 'input', title: '玩家名' }],
                          action: (pl, target) => pl.runCommand(`land add "${name}" "${target}"`)
                        })
                    },
                    {
                      text: '删除白名单',
                      action: async () =>
                        sendForm(pl, {
                          type: 'custom',
                          title: `管理 ${name} - 删除白名单`,
                          elements: [{ type: 'input', title: '玩家名' }],
                          action: (pl, target) => pl.runCommand(`land remove "${name}" "${target}"`)
                        })
                    },
                    {
                      text: '删除',
                      action: () =>
                        sendAdvancedModalForm(pl, `管理 ${name} - 删除`, `确认删除 ${name}?`, (pl) =>
                          pl.runCommand(`land del "${name}"`)
                        )
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
          case 'tp': {
            if (!name) return new SiriusCommandError('Usage: /land tp <name>')
            if (!(name in lands)) return new SiriusCommandError('Land not found.')
            const land = lands[name]
            pl.teleport(
              { x: land.start.x, y: land.start.y, z: land.start.z },
              { dimension: world.getDimension(land.start.dimension) }
            )
            return `Teleported to land ${name}`
          }
          case 'new': {
            if (!name) return new SiriusCommandError('Usage: /land new <name>')
            if (this.creatingLandProcess.has(pl.name)) return new SiriusCommandError('has creating land process.')
            if (name in lands) return new SiriusCommandError('Land already exists.')
            this.creatingLandProcess.set(pl.name, { name })
            return 'Land creating started! Use /land set a and /land set b to set two points.'
          }
          case 'set': {
            if (!this.creatingLandProcess.has(pl.name)) return new SiriusCommandError('No creating process.')
            const info = this.creatingLandProcess.get(pl.name)!
            const feetPos = {
              x: Math.floor(pl.location.x),
              y: Math.floor(pl.location.y),
              z: Math.floor(pl.location.z),
              dimension: toDim(pl.dimension)
            }
            if (name === 'a') info.a = feetPos
            else if (name === 'b') info.b = feetPos
            else return new SiriusCommandError('Usage: /land set <a|b>')
            pl.sendMessage(`Point ${name} set: ${showVector3(feetPos)}`)
            return
          }
          case 'del': {
            if (!name) return new SiriusCommandError('Usage: /land del <name>')
            if (!(name in lands)) return new SiriusCommandError('Land not found.')
            // TODO: money system
            // const price = calculateBlockCount([lands[name].start, lands[name].end]) * this.config.buyPrice
            delete lands[name]
            await Data.set('lands', allLands)
            return `Land ${name} deleted.`
          }
          case 'welcome': {
            if (!name || !msg) return new SiriusCommandError('Usage: /land welcome <name> <msg>')
            if (!(name in lands)) return new SiriusCommandError('Land not found.')
            lands[name].welcomeMsg = msg
            await Data.set('lands', allLands)
            return `Welcome message set for land ${name}.`
          }
          case 'add': {
            if (!name || !msg) return new SiriusCommandError('Usage: /land add <name> <player>')
            if (!(name in lands)) return new SiriusCommandError('Land not found.')
            if (lands[name].allowlist.includes(msg)) return new SiriusCommandError('Player already in allowlist.')
            lands[name].allowlist.push(msg)
            await Data.set('lands', allLands)
            return `Player ${msg} added to allowlist of land ${name}.`
          }
          case 'remove': {
            if (!name || !msg) return new SiriusCommandError('Usage: /land remove <name> <player>')
            if (!(name in lands)) return new SiriusCommandError('Land not found.')
            if (lands[name].allowlist.indexOf(msg) === -1) return new SiriusCommandError('Player not in allowlist.')
            lands[name].allowlist = lands[name].allowlist.filter((p) => p !== msg)
            await Data.set('lands', allLands)
            return `Player ${msg} removed from allowlist of land ${name}.`
          }
          default:
            return new SiriusCommandError('Unknown action.')
        }
      })
  }
}
