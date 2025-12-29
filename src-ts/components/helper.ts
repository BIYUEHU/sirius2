import { type Dimension, Player, type Vector3 } from '@minecraft/server'
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
      .setup((pl) => {
        if (pl.kill()) return `You died at ${showVector3(pl.location)}.`
      })
  }

  private back() {
    const LAST_DIED_LOCATION = new Map<string, [Vector3, Dimension]>()

    this.after('entityDie', (event) => {
      if (!(event.deadEntity instanceof Player)) return
      LAST_DIED_LOCATION.set(event.deadEntity.name, [event.deadEntity.location, event.deadEntity.dimension])
      event.deadEntity.sendMessage('Input /back to go back to last died location.')
    })

    this.cmd('back')
      .descr('go back to last died location')
      .setup((pl) =>
        ((location) =>
          location ? pl.teleport(location[0], { dimension: location[1] }) : 'No last died location found.')(
          LAST_DIED_LOCATION.get(pl.name)
        )
      )
  }

  private clock() {
    this.cmd('clock')
      .descr('give yourself a clock')
      .setup((pl) => pl.runCommand(`give "${pl.name}" clock`))
  }

  private here() {
    this.cmd('here')
      .descr('boardcast your location to all players')
      .setup((pl) => betterTell(`§a${pl.name} is at ${showVector3(pl.location)}`, TargetEntity.ALL))
  }

  private lore() {
    this.cmd('lore <content:String>')
      .descr('set lore of selected item, split by "|"')
      .setup((pl, [content]) => {
        const inventory = pl.getComponent('minecraft:inventory')
        const item = inventory?.container?.getItem(pl.selectedSlotIndex)
        if (!item) return 'No item selected'
        item.setLore(content?.split('|') ?? [])
        inventory?.container.setItem(pl.selectedSlotIndex, item)
      })
  }
}
