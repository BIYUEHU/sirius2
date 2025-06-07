import { CommandAccess, command } from '../framework/command'
import { SiriusCommandError } from '../framework/error'
import { showVector2, showVector3 } from '../framework/utils'

command('vanish')
  .descr('vanish yourself')
  .access(CommandAccess.OP)
  .action((pl) => pl.addEffect('invisibility', 2 * 10 ** 7, { showParticles: false, amplifier: 225 }))

command('runas <player:Player> <command>')
  .descr('run a command as another player')
  .access(CommandAccess.OP)
  .action((_, [pl, command]) => {
    try {
      pl.runCommand(command)
      return `Command "${command}" run as ${pl.name}.`
    } catch (e) {
      return new SiriusCommandError(String(e))
    }
  })

command('info [player:Player]')
  .descr('get player info')
  .access(CommandAccess.OP)
  .action((self, [target]) => {
    const pl = target ?? self
    return [
      'Info',
      `Name: ${pl.name}`,
      `Id: ${pl.id}`,
      `Gamemode: ${pl.getGameMode()}`,
      `Tags: ${pl.getTags().join(', ') || 'None'}`,
      `Rotation: ${showVector2(pl.getRotation())}`,
      `View direction: ${showVector3(pl.getViewDirection())}`,
      `Location: ${showVector3(pl.location)}`,
      `Dimension: ${pl.dimension.id}`,
      `Level: ${pl.level}`,
      `XP: ${pl.getTotalXp()}`,
      `Platform: ${pl.clientSystemInfo.platformType}`,
      `Memory tier: ${pl.clientSystemInfo.memoryTier}`,
      `Max render distance: ${pl.clientSystemInfo.maxRenderDistance}`,
      `Graphics mode: ${pl.graphicsMode}`
    ].join('\n')
  })
