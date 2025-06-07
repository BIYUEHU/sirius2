import { type HttpHeader, type HttpResponse, HttpRequest, HttpRequestMethod, http } from '@minecraft/server-net'
import { jsonParseSafe } from './utils'
import { pipe } from '../adt/utils'

export interface RequestOptions {
  heasers?: RequestHeaders
  timeout?: number
}

const REQUEST_HEADERS = Symbol('REQUEST_HEADERS')

export class RequestHeaders {
  private readonly [REQUEST_HEADERS]: HttpHeader[] = []

  public get() {
    return this[REQUEST_HEADERS]
  }

  public set(key: string, value: string) {
    this[REQUEST_HEADERS][
      ((index) => (index === -1 ? this[REQUEST_HEADERS].length : index))(
        this[REQUEST_HEADERS].findIndex((h) => h.key === key)
      )
    ].value = value
  }

  public setCookie(key: string, value: string) {
    this.set('Cookie', `${key}=${value}`)
  }

  public setAuthorization(token: string) {
    this.set('Authorization', token)
  }

  public setContentType(type: 'application/json' | 'text/plain' | 'text/html' | 'application/octet-stream') {
    this.set('Content-Type', type)
  }

  public setAccept(type: string) {
    this.set('Accept', type)
  }

  public setUserAgent(agent: string) {
    this.set('User-Agent', agent)
  }
}

export class RequestResponse<T> {
  private constructor(
    public readonly status: number,
    public readonly headers: HttpHeader[],
    public readonly data: T
  ) {}

  public static from<T>(res: HttpResponse) {
    return new RequestResponse(res.status, res.headers, jsonParseSafe(res.body).unwrapOr(res.body) as T)
  }
}

export class RequestClient {
  private buildRequest(url: string, method: HttpRequestMethod, option: RequestOptions) {
    return new HttpRequest(url)
      .setMethod(method)
      .setHeaders([...this.headers.get(), ...(option.heasers?.get() ?? [])])
      .setTimeout(option.timeout ?? new HttpRequest('').timeout)
  }

  private async transform<T>(res: Promise<HttpResponse>) {
    return await res.then(RequestResponse.from<T>)
  }

  public constructor(
    private readonly uri = '',
    private readonly headers: RequestHeaders = new RequestHeaders()
  ) {}

  // biome-ignore lint:
  public get<T = any>(
    path: string,
    params: Record<string, string | boolean | number> = {},
    options: RequestOptions = {}
  ) {
    return pipe(
      this.buildRequest(
        `${this.uri}${path}?${Object.entries(params)
          .map(([key, value]) => `${key}=${String(value)}`)
          .join('&')}`,
        HttpRequestMethod.GET,
        options
      ),
      http.request.bind(http),
      this.transform.bind(this)<T>
    )
  }

  public head(path: string, options: RequestOptions = {}) {
    return pipe(
      this.buildRequest(`${this.uri}${path}`, HttpRequestMethod.HEAD, options),
      http.request.bind(http),
      this.transform.bind(this)<never>
    )
  }

  // biome-ignore lint:
  public post<T = any>(path: string, body: unknown = {}, options: RequestOptions = {}) {
    return pipe(
      this.buildRequest(`${this.uri}${path}`, HttpRequestMethod.POST, options).setBody(JSON.stringify(body)),
      http.request.bind(http),
      this.transform.bind(this)<T>
    )
  }

  // biome-ignore lint:
  public put<T = any>(path: string, body: unknown, options: RequestOptions = {}) {
    return pipe(
      this.buildRequest(`${this.uri}${path}`, HttpRequestMethod.PUT, options).setBody(JSON.stringify(body)),
      http.request.bind(http),
      this.transform.bind(this)<T>
    )
  }

  // biome-ignore lint:
  public patch<T = any>(path: string, body: unknown, options: RequestOptions = {}) {
    return this.put<T>(path, body, options)
  }

  // biome-ignore lint:
  public delete<T = any>(path: string, options: RequestOptions = {}) {
    return pipe(
      this.buildRequest(`${this.uri}${path}`, HttpRequestMethod.DELETE, options),
      http.request.bind(http),
      this.transform.bind(this)<T>
    )
  }
}
