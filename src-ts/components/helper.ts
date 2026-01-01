import { CommandPermissionLevel, type Dimension, Player, system, type Vector3, world } from '@minecraft/server'
import { NOTICE_FILE } from 'core/framework/constant'
import { Data } from 'core/framework/data'
import { sendAdvancedModalForm, sendForm } from 'core/framework/gui'
import { Component } from '../../core/framework/component'
import { File } from '../../core/framework/file'
import { betterTell, getHash, getPlayerByName, showVector3 } from '../../core/framework/utils'

export class Helper extends Component<SiriusPluginConfig['helper']> {
  private async loadNotice() {
    return (await File.readFile(NOTICE_FILE))
      .map((noticeContent) => [noticeContent, getHash(noticeContent)] as const)
      .mapLeft(() => null)
  }

  private saveNotice(notice: string) {
    return File.writeFile(NOTICE_FILE, notice)
  }

  public setup() {
    if (this.config.noticeCmdEnabled) this.notice()
    if (this.config.suicideCmdEnabled) this.suicide()
    if (this.config.backCmdEnabled) this.back()
    if (this.config.msguiCmdEnabled) this.msgui()
    if (this.config.clockCmdEnabled) this.clock()
    if (this.config.hereCmdEnabled) this.here()
    if (this.config.loreCmdEnabled) this.lore()
  }

  private async sendNotice(pl: Player) {
    return (await this.loadNotice()).match({
      Right: ([noticeContent, hash]) => {
        sendAdvancedModalForm(pl, 'Announcement', noticeContent, async (pl) => {
          const noticed = await Data.get('noticed')
          if (noticed.hash === hash) {
            if (noticed.list.includes(pl.name)) return
            noticed.list = [...noticed.list, pl.name]
          } else {
            noticed.hash = hash
            noticed.list = [pl.name]
          }
          await Data.set('noticed', noticed)
        })
      },
      Left: () => pl.sendMessage('Notice not found.')
    })
  }

  private notice() {
    if (!IS_SERVER) {
      console.warn('Notice command is only available in server')
      return
    }

    this.cmd('notice')
      .descr('View announcement.')
      .setup((pl) => this.sendNotice(pl))

    this.cmd('noticeset <content:String>')
      .descr('Set announcement.')
      .permission(CommandPermissionLevel.GameDirectors)
      .setup(async (pl, [content]) => {
        this.saveNotice(content)
        await Data.set('noticed', { hash: getHash(content), list: [] })
        pl.sendMessage('Announcement saved.')
      })

    this.after('playerJoin', async (ev) => {
      ;(await this.loadNotice()).match({
        Right: async ([_, hash]) => {
          if ((await Data.get('noticed')).hash !== hash || !(await Data.get('noticed')).list.includes(ev.playerName)) {
            system.runTimeout(
              () =>
                getPlayerByName(ev.playerName).map((pl) => {
                  betterTell('§3You have a new announcement, please input /notice to view.', pl)
                  return this.sendNotice(pl)
                }),
              60
            )
          }
        },
        Left: () => {}
      })
    })
  }

  private suicide() {
    this.cmd('suicide')
      .descr('Suicide command.')
      .setup((pl) => {
        if (pl.kill()) return `You died at ${showVector3(pl.location)}.`
      })
  }

  private back() {
    const LAST_DIED_LOCATION = new Map<string, [Vector3, Dimension]>()

    this.after('entityDie', (event) => {
      if (!(event.deadEntity instanceof Player)) return
      LAST_DIED_LOCATION.set(event.deadEntity.name, [event.deadEntity.location, event.deadEntity.dimension])
      event.deadEntity.sendMessage('Input /back to go back to last died location.')
    })

    this.cmd('back')
      .descr('Go back to last died location.')
      .setup((pl) =>
        ((location) =>
          location ? pl.teleport(location[0], { dimension: location[1] }) : 'No last died location found.')(
          LAST_DIED_LOCATION.get(pl.name)
        )
      )
  }

  private msgui() {
    this.cmd('msgui')
      .descr('Open private message menu.')
      .setup((pl) => {
        const players = world.getPlayers().map((pl) => pl.name)
        sendForm(pl, {
          type: 'custom',
          title: '私聊',
          elements: [
            { type: 'dropdown', title: '选择玩家', items: players },
            { type: 'input', title: '发送内容' }
          ],
          action: (pl, index, input) => pl.runCommand(`msg "${players[index]}" "${input}"`)
        })
      })
  }

  private clock() {
    this.cmd('clock')
      .descr('Give yourself a clock.')
      .setup((pl) => pl.runCommand(`give "${pl.name}" clock`))
  }

  private here() {
    this.cmd('here')
      .descr('Boardcast your location to all players.')
      .setup((pl) => betterTell(`§a${pl.name} is at ${showVector3(pl.location)}`, 'all'))
  }

  private lore() {
    this.cmd('lore <content:String>')
      .descr('Set lore of selected item, split by "|".')
      .setup((pl, [content]) => {
        const inventory = pl.getComponent('minecraft:inventory')
        const item = inventory?.container?.getItem(pl.selectedSlotIndex)
        if (!item) return 'No item selected'
        item.setLore(content?.split('|') ?? [])
        inventory?.container.setItem(pl.selectedSlotIndex, item)
      })
  }
}
