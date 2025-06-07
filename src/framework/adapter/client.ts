import { world } from '@minecraft/server'
import { AdapterData } from './base'
import { jsonParseSafe } from '../utils'
import { SiriusError } from '../error'

export class AdapterClient extends AdapterData {
  protected buildKey(key: string): string {
    return `SIRIUS2-${key}}`
  }

  public async get(key: string): Promise<unknown> {
    return jsonParseSafe(world.getDynamicProperty(this.buildKey(key)) ?? '{}')
      .mapErr((e) => new SiriusError(`Failed to parse data ${key}: ${e.message}`))
      .unwrap()
  }

  public async set(key: string, value: unknown): Promise<void> {
    return world.setDynamicProperty(this.buildKey(key), JSON.stringify(value))
  }
}
