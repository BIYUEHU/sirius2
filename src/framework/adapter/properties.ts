// const COMMON_KEY = '幸福の王子はツバメを待つ'

import { world } from '@minecraft/server'
import { Result } from '../../adt/result'
import { AdapterData } from './base'

// biome-ignore lint:
function jsonParseSafe(str: any): Result<any, Error> {
  try {
    return Result.Ok(JSON.parse(str))
  } catch (e) {
    return Result.Err(e instanceof Error ? e : new Error(String(e)))
  }
}

// biome-ignore lint:
export class AdapterProperties<T extends Record<string, any> = Record<string, any>> extends AdapterData<T> {
  // biome-ignore lint:
  private proxyCache: WeakMap<object, any> = new WeakMap()

  // biome-ignore lint:
  private createProxy(key: string, value: any, topObj: any): any {
    if ((typeof value !== 'object' && !Array.isArray(value)) || value === null) return value
    if (this.proxyCache.has(value)) return this.proxyCache.get(value)

    const self = this
    const topKey = key.split('.')[0]
    const proxy = new Proxy(value, {
      // biome-ignore lint:
      get(target: any, prop: string | symbol): any {
        const result = Reflect.get(target, prop)
        return self.createProxy(`${key}.${String(prop)}`, result, topObj)
      },
      // biome-ignore lint:
      set(target: any, prop: string | symbol, newValue: any): boolean {
        Reflect.set(target, prop, newValue)
        self.set(topKey, topObj)
        return true
      },
      // biome-ignore lint:
      deleteProperty(target: any, prop: string | symbol): boolean {
        // logger.info(`Config file: ${key}.${String(prop)}`)
        Reflect.deleteProperty(target, prop)
        self.set(topKey, topObj)
        return true
      }
    })

    this.proxyCache.set(value, proxy)
    return proxy
  }

  private cache: T

  public constructor(
    filePath: string,
    public readonly decode?: boolean
  ) {
    super()
    const content = world.getDynamicProperty(filePath)
    this.cache = Object.assign(
      this.defaults ?? {},
      jsonParseSafe(typeof content === 'string' ? content : '{}')
        .mapErr((err) => console.error(`Failed to parse config file ${filePath}: ${err.message}`))
        .unwrapOr({})
    ) as T
    world.setDynamicProperty(JSON.stringify(this.cache))
  }

  public get<K extends keyof T>(key: K): T[K] {
    const value = this.cache[key]
    return this.createProxy(String(key), value, value) as T[K]
  }

  public set<K extends keyof T>(key: K, value: T[K]) {
    this.cache[key] = value
    world.setDynamicProperty(JSON.stringify(this.cache))
  }

  public delete<K extends keyof T>(key: K) {
    delete this.cache[key]
    world.setDynamicProperty(JSON.stringify(this.cache))
  }
}
