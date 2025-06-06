// biome-ignore lint:
export abstract class AdapterData<T extends Record<string, any> = Record<string, any>> {
  protected constructor(protected readonly defaults?: T) {}

  public abstract get<K extends keyof T>(key: K): T[K]

  public abstract set<K extends keyof T>(key: K, value: T[K]): void

  public abstract delete<K extends keyof T>(key: K): void
}
