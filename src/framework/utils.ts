import { type Player, world } from '@minecraft/server'

export enum TargetEntity {
  ENTITY = '@e',
  ALL = '@a',
  SELF = '@s',
  PLAYER = '@p',
  RANDOM = '@r'
}

export function betterTell(message: string, target: TargetEntity | string | Player) {
  const targetSelector = typeof target === 'object' ? target.name : target
  return world
    .getPlayers()[0]
    .runCommand(
      `tellraw ${targetSelector.startsWith('@') ? targetSelector : `"${targetSelector}"`} {"rawtext":[{"text":"${message}"}]}`
    )
}
