import { ADT } from './base'

export class Result<T, E> extends ADT {
  private readonly value: T | undefined
  private readonly error: E | undefined
  private readonly isSuccess: boolean

  private constructor(value: T | undefined, error: E | undefined, isSuccess: boolean) {
    super()
    this.value = value
    this.error = error
    this.isSuccess = isSuccess
  }

  public static Ok<T, E>(value: T): Result<T, E> {
    return new Result<T, E>(value, undefined, true)
  }

  public static Err<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(undefined, error, false)
  }

  public get tag(): 'Ok' | 'Err' {
    return this.isSuccess ? 'Ok' : 'Err'
  }

  public isOk(): boolean {
    return this.isSuccess
  }

  public isErr(): boolean {
    return !this.isSuccess
  }

  public map<U>(f: (value: T) => U): Result<U, E> {
    return this.isSuccess ? Result.Ok(f(this.value as T)) : Result.Err(this.error as E)
  }

  public mapErr<F>(f: (error: E) => F): Result<T, F> {
    return this.isSuccess ? Result.Ok(this.value as T) : Result.Err(f(this.error as E))
  }

  public andThen<U>(f: (value: T) => Result<U, E>): Result<U, E> {
    return this.isSuccess ? f(this.value as T) : Result.Err(this.error as E)
  }

  public and<U>(resb: Result<U, E>): Result<U, E> {
    return this.isSuccess ? resb : Result.Err(this.error as E)
  }

  public or(resb: Result<T, E>): Result<T, E> {
    return this.isSuccess ? this : resb
  }

  public orElse<F>(f: (error: E) => Result<T, F>): Result<T, F> {
    return this.isSuccess ? Result.Ok(this.value as T) : f(this.error as E)
  }

  public unwrap(): T {
    if (this.isSuccess) return this.value as T
    throw new Error('Called unwrap on an Err value')
  }

  public unwrapErr(): E {
    if (!this.isSuccess) return this.error as E
    throw new Error('Called unwrapErr on an Ok value')
  }

  public unwrapOr(defaultValue: T): T {
    return this.isSuccess ? (this.value as T) : defaultValue
  }

  public unwrapOrElse(f: (error: E) => T): T {
    return this.isSuccess ? (this.value as T) : f(this.error as E)
  }

  public expect(msg: string): T {
    if (this.isSuccess) return this.value as T
    throw new Error(msg)
  }

  public expectErr(msg: string): E {
    if (!this.isSuccess) return this.error as E
    throw new Error(msg)
  }

  public match<R>(handlers: { Ok: (value: T) => R; Err: (error: E) => R }): R {
    return this.isSuccess ? handlers.Ok(this.value as T) : handlers.Err(this.error as E)
  }
}
