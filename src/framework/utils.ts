import { type Player, world, type Vector3, type VectorXZ, type Vector2 } from '@minecraft/server'
import { Result } from '../adt/result'

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

export function jsonParseSafe<T = unknown>(str: unknown): Result<T, Error> {
  try {
    return Result.Ok(JSON.parse(String(str)))
  } catch (e) {
    return Result.Err(e instanceof Error ? e : new Error(String(e)))
  }
}

export function showVector3(vec: Vector3): string {
  return `${vec.x.toFixed(2)}, ${vec.y.toFixed(2)}, ${vec.z.toFixed(2)}`
}

export function toVector3(x: number, y: number, z: number): Vector3 {
  return { x, y, z }
}

export function showVector2(vec: Vector2): string {
  return `${vec.x.toFixed(2)}, ${vec.y.toFixed(2)}`
}

export function showVectorXZ(vec: VectorXZ): string {
  return `${vec.x.toFixed(2)}, ${vec.z.toFixed(2)}`
}

export function toVectorXZ(x: number, z: number): VectorXZ {
  return { x, z }
}

export function toVectorXZFromVector3({ x, z }: Vector3): VectorXZ {
  return { x, z }
}

export function t(key: string, ...args: string[]): string

export function t(key: string | TemplateStringsArray): string

export function t(key: string | TemplateStringsArray, ...args: string[]) {
  if (args && args.length > 0) {
    return args.reduce((acc, arg, index) => acc.replace(new RegExp(`\\{${index}\\}`, 'g'), t(arg)), t(key))
  }
  const input = typeof key === 'string' ? key : key.join('')
  return /* i18n.locale(input) ??  */ input
}

export function t2BaseObjProvider() {
  const date = new Date()
  return {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    min: date.getMinutes(),
    s: date.getSeconds(),
    onlineCount: world.getPlayers().length
  }
}

export function t2PlayerObjProvider(pl: Player) {
  const health = pl.getComponent('minecraft:health')
  const velocity = pl.getVelocity()
  return {
    name: pl.name,
    id: pl.id,
    gamemode: pl.getGameMode(),
    tags: pl.getTags().join(', ') || 'None',
    rotation: showVector2(pl.getRotation()),
    viewDirection: showVector3(pl.getViewDirection()),
    location: showVector3(pl.location),
    dim: pl.dimension.id.split(':')[1],
    level: pl.level,
    xp: pl.getTotalXp(),
    platform: pl.clientSystemInfo.platformType,
    memoryTier: pl.clientSystemInfo.memoryTier,
    maxRenderDistance: pl.clientSystemInfo.maxRenderDistance,
    x: pl.location.x.toFixed(0),
    y: pl.location.y.toFixed(0),
    z: pl.location.z.toFixed(0),
    health: Math.ceil(health?.currentValue ?? 0),
    maxHealth: Math.ceil(health?.effectiveMax ?? 0),
    speed: Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2).toFixed(2)
  }
}

export function t2(template: string, obj: Record<string, string | number | boolean>) {
  return Object.entries(Object.assign(t2BaseObjProvider(), obj)).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`%${key}%`, 'g'), String(value)),
    template
  )
}
