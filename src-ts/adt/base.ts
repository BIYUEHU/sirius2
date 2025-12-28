export abstract class ADT {
  public abstract readonly tag: string

  // biome-ignore lint: *
  public abstract match<R>(handlers: { [key: string]: (...args: any[]) => R }): R
}
