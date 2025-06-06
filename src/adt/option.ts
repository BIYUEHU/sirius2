import { ADT } from './base'

export class Option<T> extends ADT {
  private readonly value: T | undefined
  private readonly hasValue: boolean

  private constructor(value: T | undefined, hasValue: boolean) {
    super()
    this.value = value
    this.hasValue = hasValue
  }

  public static Some<T>(value: T): Option<T> {
    return new Option<T>(value, true)
  }

  public static None<T>(): Option<T> {
    return new Option<T>(undefined, false)
  }

  public get tag(): 'Some' | 'None' {
    return this.hasValue ? 'Some' : 'None'
  }

  public isSome(): boolean {
    return this.hasValue
  }

  public isNone(): boolean {
    return !this.hasValue
  }

  public map<U>(f: (value: T) => U): Option<U> {
    return this.hasValue ? Option.Some(f(this.value as T)) : Option.None()
  }

  public andThen<U>(f: (value: T) => Option<U>): Option<U> {
    return this.hasValue ? f(this.value as T) : Option.None()
  }

  public and<U>(optb: Option<U>): Option<U> {
    return this.hasValue ? optb : Option.None()
  }

  public or(optb: Option<T>): Option<T> {
    return this.hasValue ? this : optb
  }

  public orElse(f: () => Option<T>): Option<T> {
    return this.hasValue ? this : f()
  }

  public unwrap(): T {
    if (this.hasValue) return this.value as T
    throw new Error('Called unwrap on a None value')
  }

  public unwrapOr(defaultValue: T): T {
    return this.hasValue ? (this.value as T) : defaultValue
  }

  public unwrapOrElse(f: () => T): T {
    return this.hasValue ? (this.value as T) : f()
  }

  public expect(msg: string): T {
    if (this.hasValue) return this.value as T
    throw new Error(msg)
  }

  public match<R>(handlers: { Some: (value: T) => R; None: () => R }): R {
    return this.hasValue ? handlers.Some(this.value as T) : handlers.None()
  }
}
