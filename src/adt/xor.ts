import { ADT } from './base'

export class Xor<T, E> extends ADT {
  private readonly state: 'Loading' | 'Success' | 'Error'
  private readonly value: T | undefined
  private readonly error: E | undefined

  private constructor(state: 'Loading' | 'Success' | 'Error', value?: T, error?: E) {
    super()
    this.state = state
    this.value = value
    this.error = error
  }

  public static Loading<T, E>(): Xor<T, E> {
    return new Xor<T, E>('Loading')
  }

  public static Success<T, E>(value: T): Xor<T, E> {
    return new Xor<T, E>('Success', value)
  }

  public static Error<T, E>(error: E): Xor<T, E> {
    return new Xor<T, E>('Error', undefined, error)
  }

  public get tag(): 'Loading' | 'Success' | 'Error' {
    return this.state
  }

  public isLoading(): boolean {
    return this.state === 'Loading'
  }

  public isSuccess(): boolean {
    return this.state === 'Success'
  }

  public isError(): boolean {
    return this.state === 'Error'
  }

  public map<U>(f: (value: T) => U): Xor<U, E> {
    return this.match({
      Loading: () => Xor.Loading<U, E>(),
      Success: (value) => Xor.Success<U, E>(f(value)),
      Error: (error) => Xor.Error<U, E>(error)
    })
  }

  public match<R>(handlers: {
    Loading: () => R
    Success: (value: T) => R
    Error: (error: E) => R
  }): R {
    switch (this.state) {
      case 'Loading':
        return handlers.Loading()
      case 'Success':
        return handlers.Success(this.value as T)
      case 'Error':
        return handlers.Error(this.error as E)
    }
  }
}
