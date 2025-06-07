import { system } from '@minecraft/server'
import { Command, CommandAccess, command } from '../framework/command'
import { showVector3, toVector3 } from '../framework/utils'
import { Data } from '../framework/data'
import { SiriusCommandError } from '../framework/error'

const tpr = {
  tprMaxDistance: 10000,
  tprMinDistance: 1000,
  tprSafeHeight: 319,
  tprEffectSeconds: 35
}

const TPA_RUNNING: Map<string, [string, () => void]> = new Map()

command('tpr')
  .descr('teleport to random location')
  .action((pl) => {
    const init = tpr.tprMaxDistance - tpr.tprMinDistance + 1 + tpr.tprMinDistance
    const [x, z] = new Array(2).fill(0).map(() => Math.floor(Math.random() * init))
    pl.teleport(toVector3(x, tpr.tprSafeHeight, z))
    pl.addEffect('slow_falling', 20 * tpr.tprEffectSeconds, { showParticles: false })
  })

command('tpa <action> [player:Player]')
  .descr('Send or respond to teleport request')
  .action((sender, [action, target]) => {
    const senderId = sender.id
    const senderName = sender.name

    if (action === 'to' || action === 'here') {
      if (!target) return new SiriusCommandError('Missing target player.')

      const targetId = target.id
      if (TPA_RUNNING.has(targetId)) {
        return new SiriusCommandError(`${target.name} already has a pending request.`)
      }

      const timer = system.runTimeout(() => {
        TPA_RUNNING.delete(targetId)
        sender.sendMessage(`Teleport request to ${target.name} timed out.`)
        target.sendMessage(`Teleport request from ${senderName} timed out.`)
      }, 20 * 15)

      TPA_RUNNING.set(targetId, [
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
      const req = TPA_RUNNING.get(senderId)
      if (!req) return new SiriusCommandError('No pending request found.')
      const [_, callback] = req
      callback()
      TPA_RUNNING.delete(senderId)
      return 'Teleport request accepted.'
    }

    if (action === 'de') {
      if (TPA_RUNNING.has(senderId)) {
        TPA_RUNNING.delete(senderId)
        return 'Teleport request denied.'
      }
      return new SiriusCommandError('No pending request to deny.')
    }

    if (action === 'cancel') {
      let found = false
      TPA_RUNNING.forEach((v, k) => {
        if (v[0] === senderId) {
          TPA_RUNNING.delete(k)
          found = true
        }
      })
      if (!found) return new SiriusCommandError('No active teleport request.')
      return 'Teleport request cancelled.'
    }

    return new SiriusCommandError('Unknown action. Use to, here, ac, de, cancel.')
  })

command('home <action> [name:string]')
  .descr('home command: ls, go, add, del')
  .action(async (pl, [action, name]) => {
    const homesDB = await Data.get('homes')
    if (!homesDB[pl.id]) homesDB[pl.id] = {}
    const userHomes = homesDB[pl.id]

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
        pl.teleport({ x: pos.x, y: pos.y, z: pos.z }, { dimension: pos.dimension })
        return `Teleported to home "${name}".`
      }
      case 'add': {
        if (!name) return new SiriusCommandError(`Usage: ${Command.COMMAND_PREFIX}home add <name>`)
        if (userHomes[name]) return new SiriusCommandError(`Home "${name}" already exists.`)
        userHomes[name] = {
          x: pl.location.x,
          y: pl.location.y,
          z: pl.location.z,
          dimension: pl.dimension
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

command('warp <action> [name:string]')
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
        pl.teleport({ x: pos.x, y: pos.y, z: pos.z }, { dimension: pos.dimension })
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
          dimension: pl.dimension
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
