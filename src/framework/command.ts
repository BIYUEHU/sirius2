import { type Player, world, system } from '@minecraft/server'
import { Result } from '../adt/result'
import { handleCallbackReturn, type CallbackReturnReal } from './common'
import { pipe } from '../adt/utils'

export class CommandError extends Error {}

type ArgType = 'string' | 'number' | 'boolean'
type ArgTypeReal = string | number | boolean

type ParseArgType<S extends string> = S extends `${infer _}:${infer Type}`
  ? Type extends 'string'
    ? string
    : Type extends 'number'
      ? number
      : Type extends 'boolean'
        ? boolean
        : never
  : string

type ParseArg<S extends string> = S extends `<${infer Info}>`
  ? ParseArgType<Info>
  : S extends `[${infer Info}]`
    ? ParseArgType<Info> | undefined
    : never

type ParseArgs<S extends string> = S extends `${infer Head} ${infer Tail}`
  ? [ParseArg<Head>, ...ParseArgs<Tail>]
  : S extends ''
    ? []
    : [ParseArg<S>]

type InferCommandTemplate<S extends string> = S extends `${infer _} <${infer Args}`
  ? ParseArgs<`<${Args}`>
  : S extends `${infer _} [${infer Args}`
    ? ParseArgs<`[${Args}`>
    : []

export enum CommandAccess {
  ALL = 'all',
  OP = 'op'
}

export type CommandCallback = (player: Player, args: ArgTypeReal[]) => CallbackReturnReal

interface CommandDefinition {
  root: string
  args: [string, ArgType, boolean][]
  callback?: CommandCallback
  description?: string
  access: CommandAccess
  // TODO: alias, shortcut, help
}

const COMMAND_PREFIX = '~'

export class Command<S extends string> {
  private static readonly COMMANDS: Set<CommandDefinition> = new Set()

  public constructor(
    private readonly template: CommandDefinition,
    _: S
  ) {}

  public action(action: (player: Player, args: InferCommandTemplate<S>) => CallbackReturnReal) {
    if (this.template.callback !== undefined) throw new CommandError('Command already has an action')
    this.template.callback = action as CommandCallback
    if (Array.from(Command.COMMANDS).some((c) => c.root === this.template.root)) {
      throw new CommandError('Command already registered')
    }
    Command.COMMANDS.add(this.template)
  }

  public access(access: CommandAccess) {
    this.template.access = access
    return this
  }

  public descr(desc: string) {
    this.template.description = desc
    return this
  }

  public static run(input: string, player: Player): Result<CallbackReturnReal, Error> {
    const handle = `${input} `
    const args: string[] = []
    let current = ''
    let inQuotes = false
    let escaped = false

    for (let i = 0; i < handle.length; i++) {
      const char = handle[i]

      if (escaped) {
        current += char
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          args.push(current)
          current = ''
        }
      } else {
        current += char
      }
    }
    if (args.length === 0) args.push(handle)

    const root = args.shift() as string
    const command = Array.from(Command.COMMANDS).find((c) => c.root === root)
    if (!command) return Result.Err(new CommandError(`Unknown command: ${root}`))

    if (command.access === CommandAccess.OP && !player.isOp()) {
      return Result.Err(new Error('You do not have permission to use this command'))
    }

    const parsedArgs: ArgTypeReal[] = []
    const minnum = command.args.filter(([_, __, optional]) => !optional).length
    if (args.length < minnum) {
      return Result.Err(new Error(`Too few arguments expected ${minnum}`))
    }

    for (const [index, value] of args.entries()) {
      if (index >= args.length) return Result.Err(new Error(`Too many arguments expected ${command.args.length}`))

      const [name, type, optional] = command.args[index]
      if (value === undefined && !optional) return Result.Err(new Error(`Missing required argument: ${name}`))
      if (value === undefined) continue

      if (type === 'number') {
        const num = Number(value)
        if (Number.isNaN(num)) {
          return Result.Err(new Error(`Invalid number argument: ${name}`))
        }
        parsedArgs.push(num)
      } else if (type === 'boolean') {
        if (!['true', 'false'].includes(value)) {
          return Result.Err(new Error(`Invalid boolean argument: ${name}`))
        }
        parsedArgs.push(value === 'true')
      } else {
        parsedArgs.push(value)
      }
    }

    return Result.Ok((command.callback as CommandCallback)(player, parsedArgs))
  }
}

export function command<S extends string>(template: S): Command<S> {
  const parts = template.trim().split(/\s+/)
  const args: [string, ArgType, boolean][] = []
  const rootParts: string[] = []

  let parsingArgs = false

  for (const part of parts) {
    if (part.startsWith('<') && part.endsWith('>')) {
      parsingArgs = true
      const content = part.slice(1, -1)
      const [name, type = 'string'] = content.split(':')
      if (!['string', 'number', 'boolean'].includes(type)) {
        throw new CommandError(`Invalid type annotation: ${type}`)
      }
      args.push([name, type as ArgType, false])
    } else if (part.startsWith('[') && part.endsWith(']')) {
      parsingArgs = true
      const content = part.slice(1, -1)
      const [name, type = 'string'] = content.split(':')
      if (!['string', 'number', 'boolean'].includes(type)) {
        throw new CommandError(`Invalid type annotation: ${type}`)
      }
      args.push([name, type as ArgType, true])
    } else {
      if (parsingArgs) {
        throw new CommandError(`Invalid template: argument "${part}" cannot follow argument`)
      }
      rootParts.push(part)
    }
  }

  return new Command({ root: rootParts.join(' '), args, access: CommandAccess.ALL }, template)
}

world.beforeEvents.chatSend.subscribe((event) => {
  if (!event.message.startsWith(COMMAND_PREFIX)) return

  event.cancel = true
  system.run(async () => {
    const result = Command.run(event.message.slice(COMMAND_PREFIX.length).trim(), event.sender)
    if (result.isErr()) {
      event.sender.sendMessage(`§c${result.unwrapErr().message}`)
    } else {
      await pipe(result, Result.prototype.unwrap.bind(result), handleCallbackReturn, (str) =>
        str.then((str) => str && event.sender.sendMessage(str))
      )
    }
  })
})
