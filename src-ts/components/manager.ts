import { CommandAccess } from '../../core/framework/command'
import { SiriusCommandError } from '../../core/framework/error'
import { showVector2, showVector3 } from '../../core/framework/utils'
import { Component } from '../../core/framework/component'

export class Manager extends Component<SiriusPluginConfig['manager']> {
  public setup() {
    if (this.config.vanishCmdEnabled) this.vanish()
    if (this.config.runasCmdEnabled) this.runas()
    if (this.config.infoCmdEnabled) this.info()
  }

  private vanish() {
    this.cmd('vanish')
      .descr('vanish yourself')
      .access(CommandAccess.OP)
      .action((pl) => pl.addEffect('invisibility', 2 * 10 ** 7, { showParticles: false, amplifier: 225 }))
  }

  private runas() {
    this.cmd('runas <player:Player> <command>')
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
  }

  private info() {
    this.cmd('info [player:Player]')
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
  }
}
