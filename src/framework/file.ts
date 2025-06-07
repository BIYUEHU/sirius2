import { Result } from '../adt/result'
import { id } from '../adt/utils'
import { RequestClient, type RequestResponse } from './request'

// biome-ignore lint:
type FileRespose = { success: true; data: any } | { success: false; error: string }

export class Path {
  private readonly args: string[] = []

  public constructor(path: string) {
    this.args = ((arr) => (path.startsWith('/') ? ['/', ...arr] : arr))(path.split('/'))
  }

  public toString() {
    return this.args.join('/')
  }

  public join(path: string): Path {
    return new Path(`${this.toString()}/${path}`)
  }

  public extname(): string {
    return ((filename) => ((index) => (index === -1 ? '' : filename.slice(index)))(filename.lastIndexOf('.')))(
      this.args[this.args.length - 1]
    )
  }

  public dirname() {
    return this.args.slice(0, -1).join('/')
  }

  public basename(): string {
    return this.args[this.args.length - 1]
  }

  public isAbsolute(): boolean {
    return this.args[0] === '/'
  }
}

export namespace File {
  const http = new RequestClient(CONFIG.server_url)

  async function handle(res: Promise<RequestResponse<FileRespose>>): Promise<Result<void, string>>
  async function handle<T, R = T>(
    res: Promise<RequestResponse<FileRespose>>,
    callback: (data: T) => R
  ): Promise<Result<R, string>>
  async function handle<T, R = T>(
    res: Promise<RequestResponse<FileRespose>>,
    callback?: (data: T) => R
  ): Promise<Result<R, string>> {
    let handle: RequestResponse<FileRespose>
    try {
      handle = await res
    } catch (e) {
      return Result.Err(`Http Error: ${String(e)}`)
    }
    if (handle.status !== 200) {
      return Result.Err(`Http Error: ${handle.status}, please check the http server is running.`)
    }
    if (handle.data.success) return Result.Ok(callback ? callback(handle.data.data) : (undefined as R))
    return Result.Err(`IO Error: ${handle.data.error}`)
  }

  // biome-ignore lint:
  export function readFile<T = any>(path: string | Path): Promise<Result<T, string>> {
    return handle<T>(http.get<FileRespose>(`/io/file/${path.toString()}`), id)
  }

  export function writeFile(path: string | Path, data: unknown): Promise<Result<void, string>> {
    return handle(http.put<FileRespose>(`/io/file/${path.toString()}`, data))
  }

  export function deleteFile(path: string | Path): Promise<Result<void, string>> {
    return handle(http.delete<FileRespose>(`/io/file/${path.toString()}`))
  }

  export function exists(path: string | Path): Promise<Result<void, string>> {
    return handle(http.get<FileRespose>(`/io/exists/${path.toString()}`))
  }

  export function isFile(path: string | Path): Promise<Result<void, string>> {
    return handle(http.get<FileRespose>(`/io/isFile/${path.toString()}`))
  }

  export function isDirectory(path: string | Path): Promise<Result<void, string>> {
    return handle(http.get<FileRespose>(`/io/isDir/${path.toString()}`))
  }

  export function createDirectory(path: string | Path): Promise<Result<void, string>> {
    return handle(http.post<FileRespose>(`/io/mkdir/${path.toString()}`))
  }

  export function listDirectory(path: string | Path): Promise<Result<string[], string>> {
    return handle<string[]>(http.get<FileRespose>(`/io/list/${path.toString()}`), id)
  }

  export function deleteDirectory(path: string | Path): Promise<Result<void, string>> {
    return handle(http.delete<FileRespose>(`/io/rmdir/${path.toString()}`))
  }

  export function copy(src: string | Path, dest: string | Path): Promise<Result<void, string>> {
    return handle(http.post<FileRespose>('/io/copy', { src: src.toString(), dest: dest.toString() }))
  }

  export function resolve(path: string | Path): Promise<Result<string, string>> {
    return handle<string>(http.get<FileRespose>(`/io/resolve/${path.toString()}`), id)
  }

  export function root(): Promise<Result<string, string>> {
    return resolve(new Path('./'))
  }
}
