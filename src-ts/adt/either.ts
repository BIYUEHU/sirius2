import { ADT } from './base'

export class Either<T, E> extends ADT {
  private readonly value: T | undefined
  private readonly error: E | undefined
  private readonly isSuccess: boolean

  private constructor(value: T | undefined, error: E | undefined, isSuccess: boolean) {
    super()
    this.value = value
    this.error = error
    this.isSuccess = isSuccess
  }

  public static Right<T, E>(value: T): Either<T, E> {
    return new Either<T, E>(value, undefined, true)
  }

  public static Left<T, E>(error: E): Either<T, E> {
    return new Either<T, E>(undefined, error, false)
  }

  public get tag(): 'Ok' | 'Err' {
    return this.isSuccess ? 'Ok' : 'Err'
  }

  public isRight(): boolean {
    return this.isSuccess
  }

  public isLeft(): boolean {
    return !this.isSuccess
  }

  public map<U>(f: (value: T) => U): Either<U, E> {
    return this.isSuccess ? Either.Right(f(this.value as T)) : Either.Left(this.error as E)
  }

  public mapLeft<F>(f: (error: E) => F): Either<T, F> {
    return this.isSuccess ? Either.Right(this.value as T) : Either.Left(f(this.error as E))
  }

  public andThen<U>(f: (value: T) => Either<U, E>): Either<U, E> {
    return this.isSuccess ? f(this.value as T) : Either.Left(this.error as E)
  }

  public and<U>(resb: Either<U, E>): Either<U, E> {
    return this.isSuccess ? resb : Either.Left(this.error as E)
  }

  public or(resb: Either<T, E>): Either<T, E> {
    return this.isSuccess ? this : resb
  }

  public orElse<F>(f: (error: E) => Either<T, F>): Either<T, F> {
    return this.isSuccess ? Either.Right(this.value as T) : f(this.error as E)
  }

  public unwrap(): T {
    if (this.isSuccess) return this.value as T
    throw new Error('Called unwrap on an Err value')
  }

  public unwrapLeft(): E {
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

  public expectLeft(msg: string): E {
    if (!this.isSuccess) return this.error as E
    throw new Error(msg)
  }

  public match<R>(handlers: { Right: (value: T) => R; Left: (error: E) => R }): R {
    return this.isSuccess ? handlers.Right(this.value as T) : handlers.Left(this.error as E)
  }
}
