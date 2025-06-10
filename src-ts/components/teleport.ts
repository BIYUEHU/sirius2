import { system } from '@minecraft/server'
import { Command } from '../../core/framework/command'
import { fromDim, getRealTopmostBlockY, showVector3, toDim, toVector3, toVectorXZ } from '../../core/framework/utils'
import { Data } from '../../core/framework/data'
import { SiriusCommandError } from '../../core/framework/error'
import { Component } from '../../core/framework/component'

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
      .descr('teleport to random location')
      .action((pl) => {
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
    this.cmd('tpa <action> [player:Player]')
      .descr('Send or respond to teleport request')
      .action((sender, [action, target]) => {
        const senderId = sender.id
        const senderName = sender.name

        if (action === 'to' || action === 'here') {
          if (!target) return new SiriusCommandError('Missing target player.')

          const targetId = target.id
          if (this.TPA_RUNNING.has(targetId)) {
            return new SiriusCommandError(`${target.name} already has a pending request.`)
          }

          const timer = system.runTimeout(() => {
            this.TPA_RUNNING.delete(targetId)
            sender.sendMessage(`Teleport request to ${target.name} timed out.`)
            target.sendMessage(`Teleport request from ${senderName} timed out.`)
          }, 20 * this.config.tpaExpireTime)

          this.TPA_RUNNING.set(targetId, [
            senderId,
            () => {
              if (action === 'to') sender.teleport(target.location, { dimension: target.dimension })
              else target.teleport(sender.location, { dimension: sender.dimension })
              system.clearRun(timer)
            }
          ])

          sender.sendMessage(`Request sent to ${target.name}.`)
          target.sendMessage(
            `${senderName} wants to teleport ${action === 'to' ? 'to you' : 'you to them'}. Input "/tpa ac" to accept or "/tpa de" to deny.`
          )
          return
        }

        if (action === 'ac') {
          const req = this.TPA_RUNNING.get(senderId)
          if (!req) return new SiriusCommandError('No pending request found.')
          const [_, callback] = req
          callback()
          this.TPA_RUNNING.delete(senderId)
          return 'Teleport request accepted.'
        }

        if (action === 'de') {
          if (this.TPA_RUNNING.has(senderId)) {
            this.TPA_RUNNING.delete(senderId)
            return 'Teleport request denied.'
          }
          return new SiriusCommandError('No pending request to deny.')
        }

        if (action === 'cancel') {
          let found = false
          for (const [k, [target]] of this.TPA_RUNNING) {
            if (k !== senderId) continue
            this.TPA_RUNNING.delete(k)
            found = true
          }
          if (!found) return new SiriusCommandError('No active teleport request.')
          return 'Teleport request cancelled.'
        }

        return new SiriusCommandError('Unknown action. Use to, here, ac, de, cancel.')
      })
  }

  private home() {
    this.cmd('home <action> [name:string]')
      .descr('home command: ls, go, add, del')
      .action(async (pl, [action, name]) => {
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
            if (!name) return new SiriusCommandError(`Usage: ${Command.COMMAND_PREFIX}home go <name>`)
            if (!userHomes[name]) return new SiriusCommandError(`No home named "${name}".`)
            const pos = userHomes[name]
            pl.teleport({ x: pos.x, y: pos.y, z: pos.z }, { dimension: fromDim(pos.dimension) })
            return `Teleported to home "${name}".`
          }
          case 'add': {
            if (!name) return new SiriusCommandError(`Usage: ${Command.COMMAND_PREFIX}home add <name>`)
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
            if (!name) return new SiriusCommandError(`Usage: ${Command.COMMAND_PREFIX}home del <name>`)
            if (!userHomes[name]) return new SiriusCommandError(`No home named "${name}".`)
            delete userHomes[name]
            await Data.set('homes', homesDB)
            return `Home "${name}" deleted.`
          }
          default:
            return new SiriusCommandError('Unknown action. Use ls, go, add, del.')
        }
      })
  }

  private warp() {
    this.cmd('warp <action> [name:string]')
      .descr('warp command: ls, go, add, del')
      .action(async (pl, [action, name]) => {
        const warpsDB = await Data.get('warps')

        switch (action) {
          case 'ls': {
            const list = Object.entries(warpsDB).map(([name, pos]) => `${name} (${showVector3(pos)})`)
            if (list.length === 0) return new SiriusCommandError('No warps set.')
            return `Warps:\n${list.join('\n')}`
          }
          case 'go': {
            if (!name) return new SiriusCommandError(`Usage: ${Command.COMMAND_PREFIX}warp go <name>`)
            const pos = warpsDB[name]
            if (!pos) return new SiriusCommandError(`Warp "${name}" does not exist.`)
            pl.teleport({ x: pos.x, y: pos.y, z: pos.z }, { dimension: fromDim(pos.dimension) })
            return `Warped to "${name}".`
          }
          case 'add': {
            if (!pl.isOp()) return new SiriusCommandError('Permission denied.')
            if (!name) return new SiriusCommandError(`Usage: ${Command.COMMAND_PREFIX}warp add <name>`)
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
            if (!pl.isOp()) return new SiriusCommandError('Permission denied.')
            if (!name) return new SiriusCommandError(`Usage: ${Command.COMMAND_PREFIX}warp del <name>`)
            if (!warpsDB[name]) return new SiriusCommandError(`Warp "${name}" not found.`)
            delete warpsDB[name]
            await Data.set('warps', warpsDB)
            return `Warp "${name}" deleted.`
          }
          default:
            return new SiriusCommandError('Unknown action. Use ls, go, add, del.')
        }
      })
  }
}
