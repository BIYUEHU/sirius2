export abstract class AdapterData {
  public abstract get(key: string): Promise<unknown>

  public abstract set(key: string, value: unknown): Promise<void>
}
