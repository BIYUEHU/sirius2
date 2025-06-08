declare interface SiriusPluginConfig {
  global: {
    decode: boolean
    lang: 'en_US' | 'ja_JP' | 'zh_CN' | 'zh_TW'
  }
  utils: {
    enabled: boolean
    itemsUseOn: Record<string, string>
    joinWelcomeEnabled: boolean
    joinWelcomeMsg: string
    // ! motdDynastyEnabled: boolean
    // ! motdMsgs: string[]
    // ! motdInterval: number
    chatFormatEnabled: boolean
    chatFormat: string
    sidebarEnabled: boolean
    sidebarTitle: string
    sidebarList: string[]
    sidebarRefreshInterval: number
    sidebarMaxLines: number
    actionbarEnabled: boolean
    actionbarTemplate: string
    actionbarRefreshInterval: number
    headbarEnabled: boolean
    headbarTemplate: string
    headbarRefreshInterval: number
  }
  helper: {
    enabled: boolean
    // ! nbtCommandEnabled: boolean
    //* noticeCmdEnabled: boolean
    suicideCmdEnabled: boolean
    backCmdEnabled: boolean
    clockCmdEnabled: boolean
    //* msguiCmdEnabled: boolean
    hereCmdEnabled: boolean
    loreCmdEnabled: boolean
    // ! mapCmdEnabled: boolean
  }
  teleport: {
    enabled: boolean
    tpaCmdEnabled: boolean
    tpaExpireTime: number
    tprCmdEnabled: boolean
    tprMaxDistance: number
    tprMinDistance: number
    tprEffectionSeconds: number
    homeCmdEnabled: boolean
    homeMaxCount: number
    warpCmdEnabled: boolean
    // ! transferCmdEnabled: boolean
  }
  gui: {
    enabled: boolean
    // ! menuCmdEnabled: boolean
    // ! menuCmdAlias: string
  }
  manager: {
    enabled: boolean
    //* mangerCmdEnabled: boolean
    vanishCmdEnabled: boolean
    runasCmdEnabled: boolean
    //* banCmdEnabled: boolean
    //* cloudBlackCheckEnabled: boolean
    // ! skickCmdEnabled: boolean
    // ! crashCmdEnabled: boolean
    // ! stopCmdEnabled: boolean
    infoCmdEnabled: boolean
    //* safeCmdEnabled: boolean
  }
  /* land: {
      enabled: boolean
      maxBlockCount: number
      buyPrice: number
      destPrice: number
  },
  money: {
      enabled: boolean
      // default: number
      scoreboardName: string
      syncLLMoney: boolean
      // payRate: number
      shopCmdEnabled: boolean
      hunterEnabled: boolean
  }, */
  /*   hunter: Array<{ entityId: string; price: number | [number, number] }>
  shop: Record<
    string,
    Array<{ icon?: string; text: string; count?: number; itemId: string; price: number; type: 'buy' | 'sell' }>
  > */
}

declare const CONFIG: {
  server_url: string
  server_token: number
  dataId: string
  plugin: SiriusPluginConfig
}

declare const AdapterDataSome: new () => object

declare module '*package.json' {
  const value: any
  export default value
}
