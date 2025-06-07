// const COMMON_KEY = '幸福の王子はツバメを待つ'

import type { AdapterData } from './adapter/base'
import type { Position } from './common'

const DATABASE_DEFAULT = {
  // xuids: {} as Record<string, string>,
  // tpasEnableList: [] as string[],
  homes: {} as Record<string, Record<string, Position>>,
  warps: {} as Record<string, Position>
  // lands: {} as Record<
  //   string,
  //   Record<string, { start: Position; end: Position; allowlist: string[]; leaveMsg: string; welcomeMsg: string }>
  // >,
  // noticed: {
  //   hash: 0,
  //   list: [] as string[]
  // },
  // denylist: {} as Record<string, string>,
  // bans: {} as Record<string, { reason: string; time: number }>,
  // safe: {
  //   status: falsex
  // }
}

export type Database = typeof DATABASE_DEFAULT

export namespace Data {
  let cache: Database | undefined
  const adapter = new AdapterDataSome() as AdapterData

  async function init(): Promise<Database> {
    if (cache) return cache
    cache = Object.assign(DATABASE_DEFAULT, await adapter.get(CONFIG.dataId)) as Database
    await adapter.set(CONFIG.dataId, cache)
    return cache
  }

  export async function get<K extends keyof Database>(key: K): Promise<Database[K]> {
    return (await init())[key] as Database[K]
  }

  export async function set<K extends keyof Database>(key: K, value: Database[K]): Promise<void> {
    ;(await init())[key] = value
    adapter.set(CONFIG.dataId, cache)
  }

  export async function deleteKey<K extends keyof Database>(key: K): Promise<void> {
    delete (await init())[key]
    adapter.set(CONFIG.dataId, cache)
  }
}
