import { system, world } from '@minecraft/server'
import { sendAdvancedModalForm, sendForm, sendSimpleForm } from 'core/framework/gui'
import { Component } from '../../core/framework/component'
import { Data } from '../../core/framework/data'
import { SiriusCommandError } from '../../core/framework/error'
import {
  fromDim,
  getRealTopmostBlockY,
  isOpPlayer,
  showVector3,
  toDim,
  toVector3,
  toVectorXZ
} from '../../core/framework/utils'

export class Teleport extends Component<SiriusPluginConfig['teleport']> {
  private TPA_RUNNING: Map<string, [string, () => void]> = new Map()

  public setup() {
    if (this.config.tprCmdEnabled) this.tpr()
    if (this.config.tpaCmdEnabled) this.tpa()
    if (this.config.homeCmdEnabled) this.home()
    if (this.config.warpCmdEnabled) this.warp()
  }

  private tpr() {
    this.cmd('tpr')
      .descr('Teleport to random location.')
      .setup((pl) => {
        const init = this.config.tprMaxDistance - this.config.tprMinDistance + 1 + this.config.tprMinDistance
        const [x, z] = new Array(2).fill(0).map(() => Math.floor(Math.random() * init))
        pl.teleport(toVector3(x, pl.dimension.getTopmostBlock(toVectorXZ(x, z))?.y ?? 320, z))
        pl.addEffect('slow_falling', 20 * this.config.tprEffectionSeconds, { showParticles: false })

        const start = Date.now()
        const tryLand = () => {
          const timer = system.runTimeout(() => {
            system.clearRun(timer)
            getRealTopmostBlockY(pl.dimension, x, z).match({
              Just(y) {
                pl.teleport(toVector3(x, y + 1, z))
                pl.removeEffect('slow_falling')
              },
              Nothing() {
                if (!pl.isOnGround && !pl.isInWater && Date.now() - start <= 7 * 1000) tryLand()
              }
            })
          }, 1 * 20)
        }
        tryLand()
      })
  }

  private tpa() {
    this.before('playerLeave', (ev) => {
      for (const [sender, [target]] of this.TPA_RUNNING) {
        if ([sender, target].includes(ev.player.name)) this.TPA_RUNNING.delete(sender)
      }
    })

    this.enum('tpaAction', ['to', 'here', 'ac', 'de', 'cancel', 'gui'])
    this.cmd('tpa <action:Enum-tpaAction> [player:Player]')
      .descr('Send or respond to teleport request.')
      .setup((sender, [action, target]) => {
        if (action === 'to' || action === 'here') {
          if (!target) return new SiriusCommandError('Missing target player.')
          console.log(JSON.stringify(target))
          if (this.TPA_RUNNING.has(target.name)) {
            return new SiriusCommandError(`${target.name} already has a pending request.`)
          }

          const timer = system.runTimeout(() => {
            if (!this.TPA_RUNNING.has(target.name)) return
            this.TPA_RUNNING.delete(target.name)
            sender.sendMessage(`Teleport request to ${target.name} timed out.`)
            target.sendMessage(`Teleport request from ${sender.name} timed out.`)
          }, 20 * this.config.tpaExpireTime)

          this.TPA_RUNNING.set(target.name, [
            sender.name,
            () => {
              if (action === 'to') sender.teleport(target.location, { dimension: target.dimension })
              else target.teleport(sender.location, { dimension: sender.dimension })
              system.clearRun(timer)
            }
          ])

          sender.sendMessage(`Request sent to ${target.name}.`)
          target.sendMessage(
            `${sender.name} wants to teleport ${action === 'to' ? 'to you' : 'you to them'}. Input "/tpa ac" to accept or "/tpa de" to deny.`
          )
          sendAdvancedModalForm(
            target,
            'Teleport Request',
            `${sender.name} wants to teleport ${action === 'to' ? 'to you' : 'you to them'}.`,
            (pl) => pl.runCommand('tpa ac'),
            (pl) => pl.runCommand('tpa de')
          )
          return
        }

        if (action === 'ac') {
          const req = this.TPA_RUNNING.get(sender.name)
          if (!req) return new SiriusCommandError('No pending request found.')
          const [_, callback] = req
          callback()
          this.TPA_RUNNING.delete(sender.name)
          return 'Teleport request accepted.'
        }

        if (action === 'de') {
          if (this.TPA_RUNNING.has(sender.name)) {
            this.TPA_RUNNING.delete(sender.name)
            return 'Teleport request denied.'
          }
          return new SiriusCommandError('No pending request to deny.')
        }

        if (action === 'cancel') {
          let found = false
          for (const [k, _] of this.TPA_RUNNING) {
            if (k !== sender.name) continue
            this.TPA_RUNNING.delete(k)
            found = true
          }
          if (!found) return new SiriusCommandError('No active teleport request.')
          return 'Teleport request cancelled.'
        }

        if (action === 'gui') {
          const players = world.getPlayers().map((p) => p.name)
          sendForm(sender, {
            type: 'custom',
            title: 'Teleport Request',
            elements: [
              { type: 'dropdown', title: 'Mode', items: ['To', 'Here'] },
              { type: 'dropdown', title: 'Target', items: players }
            ],
            action: (pl, mode, index) => {
              pl.runCommand(`tpa ${mode === 0 ? 'to' : 'here'} ${players[index]}`)
            }
          })
          return
        }

        return new SiriusCommandError('Unknown action.')
      })
  }

  private home() {
    this.enum('homeAction', ['ls', 'go', 'add', 'del', 'gui'])
    this.cmd('home <action:Enum-homeAction> [name:String]')
      .descr('Teleport to a home or manage homes.')
      .setup(async (pl, [action, name]) => {
        const homesDB = await Data.get('homes')
        if (!homesDB[pl.name]) homesDB[pl.name] = {}
        const userHomes = homesDB[pl.name]

        switch (action) {
          case 'ls': {
            const list = Object.entries(userHomes).map(([name, pos]) => `${name} (${showVector3(pos)})`)
            if (list.length === 0) return new SiriusCommandError('You have no homes.')
            return `Your homes:\n${list.join('\n')}`
          }
          case 'go': {
            if (!name) return new SiriusCommandError('Usage: /home go <name>')
            if (!userHomes[name]) return new SiriusCommandError(`No home named "${name}".`)
            const pos = userHomes[name]
            pl.teleport({ x: pos.x, y: pos.y, z: pos.z }, { dimension: fromDim(pos.dimension) })
            return `Teleported to home "${name}".`
          }
          case 'add': {
            if (!name) return new SiriusCommandError('Usage: /home add <name>')
            if (userHomes[name]) return new SiriusCommandError(`Home "${name}" already exists.`)
            if (Object.keys(userHomes).length >= this.config.homeMaxCount) {
              return new SiriusCommandError(`Maximum home count reached (${this.config.homeMaxCount}).`)
            }
            userHomes[name] = {
              x: pl.location.x,
              y: pl.location.y,
              z: pl.location.z,
              dimension: toDim(pl.dimension)
            }
            await Data.set('homes', homesDB)
            return `Home "${name}" set at ${showVector3(pl.location)}.`
          }
          case 'del': {
            if (!name) return new SiriusCommandError('Usage: /home del <name>')
            if (!userHomes[name]) return new SiriusCommandError(`No home named "${name}".`)
            delete userHomes[name]
            await Data.set('homes', homesDB)
            return `Home "${name}" deleted.`
          }
          case 'gui': {
            sendSimpleForm(
              pl,
              'Homes',
              '',
              Object.keys(userHomes).map((text) => ({
                text,
                action: () => pl.runCommand(`home go ${text}`)
              }))
            )
            return
          }
          default:
            return new SiriusCommandError('Unknown action.')
        }
      })
  }

  private warp() {
    this.enum('warpAction', ['ls', 'go', 'add', 'del', 'gui'])
    this.cmd('warp <action:Enum-warpAction> [name:String]')
      .descr('Teleport to a warp or manage warps.')
      .setup(async (pl, [action, name]) => {
        const warpsDB = await Data.get('warps')

        switch (action) {
          case 'ls': {
            const list = Object.entries(warpsDB).map(([name, pos]) => `${name} (${showVector3(pos)})`)
            if (list.length === 0) return new SiriusCommandError('No warps set.')
            return `Warps:\n${list.join('\n')}`
          }
          case 'go': {
            if (!name) return new SiriusCommandError('Usage: /warp go <name>')
            const pos = warpsDB[name]
            if (!pos) return new SiriusCommandError(`Warp "${name}" does not exist.`)
            pl.teleport({ x: pos.x, y: pos.y, z: pos.z }, { dimension: fromDim(pos.dimension) })
            return `Warped to "${name}".`
          }
          case 'add': {
            if (!isOpPlayer(pl)) return new SiriusCommandError('Permission denied.')
            if (!name) return new SiriusCommandError('Usage: /warp add <name>')
            if (warpsDB[name]) return new SiriusCommandError(`Warp "${name}" already exists.`)
            warpsDB[name] = {
              x: pl.location.x,
              y: pl.location.y,
              z: pl.location.z,
              dimension: toDim(pl.dimension)
            }
            await Data.set('warps', warpsDB)
            return `Warp "${name}" set at ${showVector3(pl.location)}.`
          }
          case 'del': {
            if (!isOpPlayer(pl)) return new SiriusCommandError('Permission denied.')
            if (!name) return new SiriusCommandError('Usage: /warp del <name>')
            if (!warpsDB[name]) return new SiriusCommandError(`Warp "${name}" not found.`)
            delete warpsDB[name]
            await Data.set('warps', warpsDB)
            return `Warp "${name}" deleted.`
          }
          case 'gui': {
            sendSimpleForm(
              pl,
              'Warps',
              '',
              Object.keys(warpsDB).map((text) => ({
                text,
                action: () => pl.runCommand(`warp go ${text}`)
              }))
            )
            return
          }
          default:
            return new SiriusCommandError('Unknown action')
        }
      })
  }
}
