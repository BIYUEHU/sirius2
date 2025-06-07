import { RequestClient } from '../request'
import { AdapterData } from './base'

export class AdapterServer extends AdapterData {
  private readonly http = new RequestClient(CONFIG.server_url)

  public async get(key: string): Promise<unknown> {
    return
  }

  public async set(key: string, value: unknown): Promise<void> {
    return
  }
}
