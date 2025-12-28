import type { Dimension, Vector3 } from '@minecraft/server'
import { Component } from '../../core/framework/component'
import { betterTell, showVector3, TargetEntity } from '../../core/framework/utils'

export class Helper extends Component<SiriusPluginConfig['helper']> {
  public setup() {
    if (this.config.suicideCmdEnabled) this.suicide()
    if (this.config.backCmdEnabled) this.back()
    if (this.config.clockCmdEnabled) this.clock()
    if (this.config.hereCmdEnabled) this.here()
    if (this.config.loreCmdEnabled) this.lore()
  }

  private suicide() {
    this.cmd('suicide')
      .descr('suicide command')
      .action((pl) => {
        if (pl.kill()) return `You died at ${showVector3(pl.location)}.`
      })
  }

  private back() {
    const LAST_DIED_LOCATION = new Map<string, [Vector3, Dimension]>()

    this.after('entityDie', (event) => {
      if (event.deadEntity.typeId !== 'minecraft:player') return
      LAST_DIED_LOCATION.set(event.deadEntity.id, [event.deadEntity.location, event.deadEntity.dimension])
      // TODO: add message to player
      console.log('Died entity id', event.deadEntity.id)
      // .sendMessage(`Input ${Command.COMMAND_PREFIX}back to go back to last died location.`)
    })

    this.cmd('back')
      .descr('go back to last died location')
      .action((pl) =>
        ((location) =>
          location ? pl.teleport(location[0], { dimension: location[1] }) : 'No last died location found.')(
          LAST_DIED_LOCATION.get(pl.id)
        )
      )
      .setup()
  }

  private clock() {
    this.cmd('clock')
      .descr('give yourself a clock')
      .action((pl) => pl.runCommand(`give "${pl.name}" clock`))
      .setup()
  }

  private here() {
    this.cmd('here')
      .descr('boardcast your location to all players')
      .action((pl) => betterTell(`§a${pl.name} is at ${showVector3(pl.location)}`, TargetEntity.ALL))
      .setup()
  }

  private lore() {
    this.cmd('lore <content:String>')
      .descr('set lore of selected item, split by "|"')
      .action((pl, [content]) => {
        const inventory = pl.getComponent('minecraft:inventory')
        const item = inventory?.container?.getItem(pl.selectedSlotIndex)
        if (!item) return 'No item selected'
        item.setLore(content?.split('|') ?? [])
        inventory?.container.setItem(pl.selectedSlotIndex, item)
      })
      .setup()
  }
}
