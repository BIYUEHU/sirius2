import { ADT } from './base'

export class Maybe<T> extends ADT {
  private readonly value: T | undefined
  private readonly hasValue: boolean

  private constructor(value: T | undefined, hasValue: boolean) {
    super()
    this.value = value
    this.hasValue = hasValue
  }

  public static Just<T>(value: T): Maybe<T> {
    return new Maybe<T>(value, true)
  }

  public static Nothing<T>(): Maybe<T> {
    return new Maybe<T>(undefined, false)
  }

  public get tag(): 'Just' | 'Nothing' {
    return this.hasValue ? 'Just' : 'Nothing'
  }

  public isJust(): boolean {
    return this.hasValue
  }

  public isNothing(): boolean {
    return !this.hasValue
  }

  public map<U>(f: (value: T) => U): Maybe<U> {
    return this.hasValue ? Maybe.Just(f(this.value as T)) : Maybe.Nothing()
  }

  public andThen<U>(f: (value: T) => Maybe<U>): Maybe<U> {
    return this.hasValue ? f(this.value as T) : Maybe.Nothing()
  }

  public and<U>(optb: Maybe<U>): Maybe<U> {
    return this.hasValue ? optb : Maybe.Nothing()
  }

  public or(optb: Maybe<T>): Maybe<T> {
    return this.hasValue ? this : optb
  }

  public orElse(f: () => Maybe<T>): Maybe<T> {
    return this.hasValue ? this : f()
  }

  public unwrap(): T {
    if (this.hasValue) return this.value as T
    throw new Error('Called unwrap on a Nothing value')
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

  public match<R>(handlers: { Just: (value: T) => R; Nothing: () => R }): R {
    return this.hasValue ? handlers.Just(this.value as T) : handlers.Nothing()
  }
}
