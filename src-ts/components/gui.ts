import { CommandPermissionLevel, Player } from '@minecraft/server'
import { GUI_PATH } from 'core/framework/constant'
import { jsonParseSafe } from 'core/framework/utils'
import { pipe } from 'src-ts/adt/utils'
import { Component } from '../../core/framework/component'
import { SiriusCommandError } from '../../core/framework/error'
import { File } from '../../core/framework/file'
import { GuiData, sendForm } from '../../core/framework/gui'

export class Gui extends Component<SiriusPluginConfig['gui']> {
  private static readonly list: Map<string, GuiData> = new Map<string, GuiData>()

  private static async loadAll(path: string = GUI_PATH) {
    ;(await File.listDirectory(path)).match({
      Right: async (list) => {
        for await (const entry of list) {
          const fullPath = `${path}/${entry.name}`
          if (entry.isDir) {
            await Gui.loadAll(`${fullPath}/`)
            continue
          }

          if (!entry.name.endsWith('.json')) continue

          ;(await File.readFile(fullPath)).match({
            Right: (content) => {
              jsonParseSafe<GuiData>(content).match({
                Right: (data) => {
                  if (!data.type) data.type = 'simple'

                  if (
                    (data.type === 'simple' &&
                      (!Array.isArray(data.buttons) ||
                        data.buttons.some((b) => typeof b.action !== 'string' || !b.text))) ||
                    (data.type === 'custom' && (typeof data.action !== 'string' || !Array.isArray(data.elements))) ||
                    (data.type === 'modal' && typeof data.confirmAction !== 'string')
                  ) {
                    console.error(`Invalid GUI format in ${fullPath}`)
                    return
                  }

                  const key = pipe(fullPath.split(`${GUI_PATH}/`), (arr) => arr[1] ?? arr[0])
                    .replace(/\.json$/, '')
                    .replace(/\//g, ':')

                  Gui.list.set(key, data)
                },
                Left: (error) => {
                  console.error(`Failed to read GUI file ${fullPath}: ${error}`)
                }
              })
            },
            Left: (error) => console.error(`Failed to read GUI file ${fullPath}: ${error}`)
          })
        }
      },
      Left: () => {}
    })
  }

  public setup() {
    if (!IS_SERVER) {
      console.warn('GUI component is only available on the server')
      return
    }
    this.gui()
    if (this.config.menuCmdEnabled) this.menu()
    this.after('worldLoad', () => {
      Gui.loadAll().catch((e) => console.error('Failed to load GUIs:', e))
    })
  }

  private gui() {
    this.enum('guiAction', ['reload', 'open'])
    this.cmd('gui <action:enum-guiAction> [name:String]')
      .descr('Open or reload GUI files.')
      .permission(CommandPermissionLevel.GameDirectors)
      .setup(async (pl, [action, name]) => {
        switch (action) {
          case 'reload': {
            Gui.list.clear()
            await Gui.loadAll()
            return 'Gui files have been reloaded.'
          }
          case 'open': {
            if (!name) return new SiriusCommandError('Usage: /gui open <name>')
            if (!this.send(pl, name)) return new SiriusCommandError(`GUI not found: ${name}`)
            return
          }
          default:
            return new SiriusCommandError('Unknown action.')
        }
      })
  }

  private menu() {
    this.cmd('menu')
      .descr('Open main menu.')
      .alias(this.config.menuCmdAlias)
      .setup((pl) => {
        this.send(pl)
      })
  }

  public send(player: Player, formName: string = 'index'): boolean {
    const guiData = Gui.list.get(formName)
    if (!guiData) {
      console.warn(`GUI not found: ${formName}`)
      return false
    }

    sendForm(player, guiData)
    return true
  }
}
