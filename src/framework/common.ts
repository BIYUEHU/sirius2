import type { Dimension, Player } from '@minecraft/server'
import type { SiriusCommandError } from './error'

export interface Position {
  dimension: Dimension
  x: number
  y: number
  z: number
}

// biome-ignore lint:
export type CallbackReturn = string | object | Array<unknown> | SiriusCommandError | void
export type CallbackReturnReal = CallbackReturn | Promise<CallbackReturn>
export type Callback = (player: Player) => CallbackReturnReal

// biome-ignore lint:
export async function handleCallbackReturn(str: CallbackReturnReal): Promise<string | void> {
  if (str instanceof Error) return `§c${str.message}`
  if (str instanceof Promise) return await handleCallbackReturn(await str)
  if (typeof str === 'string') return str
  if (str === undefined) return
  const result = JSON.stringify(str, null, 2)
  if (result === '{}') return
  return result
}
