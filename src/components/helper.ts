import { type Dimension, type Vector3, world, system, ItemStack, EntityComponentTypes } from '@minecraft/server'
import { command } from '../framework/command'
import { TargetEntity, betterTell, showVector3 } from '../framework/utils'
import { sendForm } from '../framework/gui'

const LAST_DIED_LOCATION = new Map<string, [Vector3, Dimension]>()

world.afterEvents.entityDie.subscribe((event) => {
  if (event.deadEntity.typeId !== 'minecraft:player') return
  LAST_DIED_LOCATION.set(event.deadEntity.id, [event.deadEntity.location, event.deadEntity.dimension])
  // event.player.sendMessage(`Input ${Command.COMMAND_PREFIX}back to go back to last died location.`)
})

command('suicide')
  .descr('suicide command')
  .action((pl) => {
    if (pl.kill()) return `You died at ${showVector3(pl.location)}.`
  })

command('back')
  .descr('go back to last died location')
  .action((pl) =>
    ((location) => (location ? pl.teleport(location[0], { dimension: location[1] }) : 'No last died location found.'))(
      LAST_DIED_LOCATION.get(pl.id)
    )
  )

command('clock')
  .descr('give yourself a clock')
  .action((pl) => pl.runCommand(`give "${pl.name}" clock`))

command('here')
  .descr('boardcast your location to all players')
  .action((pl) => betterTell(`§a${pl.name} is at ${showVector3(pl.location)}`, TargetEntity.ALL))

command('lore [content]')
  .descr('set lore of selected item, split by "|"')
  .action((pl, [content]) => {
    const inventory = pl.getComponent('minecraft:inventory')
    const item = inventory?.container?.getItem(pl.selectedSlotIndex)
    if (!item) return 'No item selected'
    item.setLore(content?.split('|') ?? [])
    inventory?.container.setItem(pl.selectedSlotIndex, item)
  })
