import type { Player } from '@minecraft/server'

// biome-ignore lint:
export type CallbackReturn = string | object | Array<unknown> | Error | void
export type CallbackReturnReal = CallbackReturn | Promise<CallbackReturn>
export type Callback = (player: Player) => CallbackReturnReal

// biome-ignore lint:
export async function handleCallbackReturn(str: CallbackReturnReal): Promise<string | void> {
  if (str instanceof Error) return str.message
  if (str instanceof Promise) return await handleCallbackReturn(await str)
  if (typeof str === 'string') return str
  if (str === undefined) return
  return JSON.stringify(str, null, 2)
}
