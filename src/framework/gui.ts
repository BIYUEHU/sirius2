// gui.ts

import {
  ActionFormData,
  MessageFormData,
  ModalFormData,
  type ActionFormResponse,
  type MessageFormResponse,
  type ModalFormResponse
} from '@minecraft/server-ui'
import type { Player } from '@minecraft/server'
import { handleCallbackReturn, type CallbackReturnReal } from './common'
import { pipe } from '../adt/utils'

type ModalCallback = (player: Player) => CallbackReturnReal
type SimpleCallback = (player: Player, id: number) => CallbackReturnReal
// biome-ignore lint:
type CustomCallback = (player: Player, ...data: any[]) => CallbackReturnReal

interface GuiModalData {
  type: 'modal'
  title: string
  content: string
  confirmButton?: string
  cancelButton?: string
  confirmAction: ModalCallback
  cancelAction?: ModalCallback
}

interface GuiSimpleData {
  type: 'simple'
  title: string
  content?: string
  buttons?: Array<{
    text: string
    action: SimpleCallback
    iconPath?: string
    onlyOp?: boolean
  }>
}

interface GuiCustomData {
  type: 'custom'
  title: string
  elements: Array<
    | { type: 'label'; text: string }
    | { type: 'input'; title: string; placeholder?: string; default?: string }
    | { type: 'switch'; title: string; default?: boolean }
    | { type: 'dropdown'; title: string; items: string[]; default?: number }
    | {
        type: 'slider'
        title: string
        min: number
        max: number
        step?: number
        default?: number
      }
  >
  action: CustomCallback
  onlyOp?: boolean
}

type GuiData = GuiModalData | GuiSimpleData | GuiCustomData

export function sendModalForm(
  player: Player,
  title: string,
  content: string,
  confirmAction: ModalCallback,
  cancelAction?: ModalCallback,
  confirmButton?: string,
  cancelButton?: string
) {
  sendForm(player, {
    type: 'modal',
    title,
    content,
    confirmButton: confirmButton ?? 'Confirm',
    cancelButton: cancelButton ?? 'Cancel',
    confirmAction,
    cancelAction
  })
}

export function sendAdvancedModalForm(
  player: Player,
  title: string,
  content: string,
  confirmAction: ModalCallback,
  cancelAction?: ModalCallback,
  confirmButton?: string,
  cancelButton?: string
) {
  sendForm(player, {
    type: 'simple',
    title,
    content,
    buttons: [
      {
        text: confirmButton ?? 'Confirm',
        action: confirmAction
      },
      {
        text: cancelButton ?? 'Cancel',
        action: cancelAction ?? (() => {})
      }
    ]
  })
}

export function sendSimpleForm(
  player: Player,
  title: string,
  content: string,
  buttons: Array<{
    text: string
    action: SimpleCallback
    iconPath?: string
    onlyOp?: boolean
  }>
) {
  sendForm(player, {
    type: 'simple',
    title,
    content,
    buttons
  })
}

export function sendForm(player: Player, guiData: GuiData) {
  const { type, title } = guiData

  if (type === 'modal') {
    const { content, confirmButton = 'Confirm', cancelButton = 'Cancel', confirmAction, cancelAction } = guiData

    const form = new MessageFormData().title(title).body(content).button1(cancelButton).button2(confirmButton)

    form
      .show(player)
      .then((response: MessageFormResponse) => {
        if (response.canceled) return
        if (response.selection === 1) {
          pipe(confirmAction(player), handleCallbackReturn, (str) =>
            str.then((str) => str && player.sendMessage(str)).then(() => {})
          )
        } else if (cancelAction) {
          pipe(cancelAction(player), handleCallbackReturn, (str) =>
            str.then((str) => str && player.sendMessage(str)).then(() => {})
          )
        }
      })
      .catch((e) => console.error(e))
  } else if (type === 'simple') {
    const { content = '', buttons = [] } = guiData
    const form = new ActionFormData().title(title).body(content)

    const validButtons = buttons.filter((btn) => !btn.onlyOp || player.isOp())

    validButtons.map((btn) => {
      form.button(btn.text, btn.iconPath)
    })

    form
      .show(player)
      .then((response: ActionFormResponse) => {
        if (response.canceled || response.selection === undefined) return
        pipe(validButtons[response.selection].action(player, response.selection), handleCallbackReturn, (str) =>
          str.then((str) => str && player.sendMessage(str)).then(() => {})
        )
      })
      .catch((e) => console.error(e))
  } else {
    if (guiData.onlyOp && !player.isOp()) {
      player.sendMessage('You do not have permission to use this form.')
      return
    }

    const form = new ModalFormData().title(title)
    const elementTypes: string[] = []

    guiData.elements.map((el) => {
      switch (el.type) {
        case 'label':
          form.label(el.text)
          elementTypes.push('label')
          break
        case 'input':
          form.textField(el.title, el.placeholder ?? '', { defaultValue: el.default ?? '' })
          elementTypes.push('input')
          break
        case 'switch':
          form.toggle(el.title, { defaultValue: el.default ?? false })
          elementTypes.push('switch')
          break
        case 'dropdown':
          form.dropdown(el.title, el.items, { defaultValueIndex: el.default ?? 0 })
          elementTypes.push('dropdown')
          break
        case 'slider':
          form.slider(el.title, el.min, el.max, { valueStep: el.step ?? 1, defaultValue: el.default ?? el.min })
          elementTypes.push('slider')
          break
      }
    })

    form
      .show(player)
      .then((response: ModalFormResponse) => {
        if (response.canceled) return
        pipe(guiData.action(player, ...(response.formValues ?? [])), handleCallbackReturn, (str) =>
          str.then((str) => str && player.sendMessage(str)).then(() => {})
        )
      })
      .catch((e) => console.error(e))

    return
  }
}
