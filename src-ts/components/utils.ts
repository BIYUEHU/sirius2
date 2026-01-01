import { system } from '@minecraft/server'
import { itemUse } from 'core/framework/itemUse'
import { Component } from '../../core/framework/component'
import { ActionbarManager, HeadbarManager, SidebarManager } from '../../core/framework/display'
import { betterTell, t2, t2PlayerObjProvider } from '../../core/framework/utils'

export class Utils extends Component<SiriusPluginConfig['utils']> {
  private sidebarManager?: SidebarManager
  private headbarManager?: HeadbarManager
  private actionbarManager?: ActionbarManager

  public setup() {
    if (this.config.joinWelcomeEnabled) this.joinWelcome()
    if (this.config.chatFormatEnabled) this.chatFormat()
    if (this.config.sidebarEnabled) this.sidebar()
    if (this.config.headbarEnabled) this.headbar()
    if (this.config.actionbarEnabled) this.actionbar()

    this.itemUseOn()

    this.after('playerSpawn', () => {
      system.run(() => {
        this.headbarManager?.setup()
        this.sidebarManager?.setup()
        this.actionbarManager?.setup()
      })
    })
  }

  private joinWelcome() {
    this.after('playerSpawn', (event) => {
      if (!event.initialSpawn) return
      event.player.sendMessage(t2(this.config.joinWelcomeMsg, t2PlayerObjProvider(event.player)))
    })
  }

  private chatFormat() {
    this.before('chatSend', (event) => {
      event.cancel = true
      system.run(() =>
        betterTell(
          t2(this.config.chatFormat, Object.assign(t2PlayerObjProvider(event.sender), { msg: event.message })),
          'all'
        )
      )
    })
  }

  private sidebar() {
    this.sidebarManager = new SidebarManager({
      title: this.config.sidebarTitle,
      maxLines: this.config.sidebarMaxLines,
      template: this.config.sidebarList,
      refreshInterval: this.config.sidebarRefreshInterval
    })
  }

  private headbar() {
    this.headbarManager = new HeadbarManager({
      refreshInterval: this.config.headbarRefreshInterval,
      template: this.config.headbarTemplate
    })
  }

  private actionbar() {
    this.actionbarManager = new ActionbarManager({
      refreshInterval: this.config.actionbarRefreshInterval,
      template: this.config.actionbarTemplate
    })
  }

  private itemUseOn() {
    for (const [key, value] of Object.entries(this.config.itemsUseOn)) {
      if (value) itemUse(key, (pl) => pl.runCommand(value))
    }
  }
}
