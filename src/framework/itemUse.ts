import { system, world } from '@minecraft/server'
import { handleCallbackReturn, type Callback } from './common'
import { pipe } from '../adt/utils'

const ITEM_USE: Map<string, [Callback, boolean]> = new Map()

export function itemUse(itemId: string, callback: Callback, cancel = false) {
  if (ITEM_USE.has(itemId)) {
    throw new Error(`Item '${itemId}' already has a callback registered.`)
  }
  ITEM_USE.set(itemId, [callback, cancel])
}

world.beforeEvents.itemUse.subscribe((event) => {
  const data = ITEM_USE.get(event.itemStack.typeId)
  if (!data) return
  const [callback, cancel] = data
  event.cancel = cancel
  system.run(async () => {
    await pipe(callback(event.source), handleCallbackReturn, (str) =>
      str.then((str) => str && event.source.sendMessage(str))
    )
  })
})
