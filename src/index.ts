import { pipe } from './adt/utils'
import { Helper } from './components/helper'
import { Manager } from './components/manager'
import { Teleport } from './components/teleport'
import { Utils } from './components/utils'
import { Command } from '../core/framework/command'
import { Component } from '../core/framework/component'
import { Loader } from '../core/framework/loader'
import { PLUGIN_CONFIG_DEFAULT } from './utils/config'

class Sirius2Api extends Component<{ server_url: '' }> {
  public setup() {}
}

pipe(
  PLUGIN_CONFIG_DEFAULT,
  (x: SiriusPluginConfig) => Object.assign(x, CONFIG.plugin ?? {}),
  (x) => {
    CONFIG.plugin = x
    return Command.COMMAND_PREFIX
  }
)

const Plugin = new Loader(
  CONFIG.plugin,

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
