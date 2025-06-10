export const PLUGIN_CONFIG_DEFAULT: SiriusPluginConfig = {
  // global: {
  //   decode: true,
  //   lang: 'zh_CN' as 'en_US' | 'ja_JP' | 'zh_CN' | 'zh_TW'
  // },
  utils: {
    enabled: true,
    itemsUseOn: {
      'minecraft:clock': 'menu'
    } as Record<string, string>,
    joinWelcomeEnabled: true,
    joinWelcomeMsg: '§6§lWelcome to the server, §a%name%!§r',
    // ! motdDynastyEnabled: true,
    //! motdMsgs: ['server motd!'],
    //! motdInterval: 5,
    chatFormatEnabled: true,
    chatFormat:
      '§l§e%y%-%m%-%d%§r §g§l%h%:%min%:%s%§r §r§l[§a%dim% §r§l| §l§c%health%❤ §r§l| §6%gamemode%§r§l] §r%name%: %msg%',
    sidebarEnabled: true,
    sidebarTitle: '§6§l=== Server Info ===',
    sidebarList: [
      '',
      '§aNam: §f%name%',
      // '§bPos: §f%x%, %y%, %z%',
      '§cHlt: §f%health%/%maxHealth%',
      '§eLvl: §f%level% (XP: %xp%)',
      '§dDim: §f%dim%',
      '§9Spd: §f%speed%',
      '',
      '§bTime: §f%h%:%min%:%s%',
      '§7Online: §f%onlineCount%',
      '',
      '§6§oWelcome to the server!'
    ],
    sidebarRefreshInterval: 1 * 20,
    sidebarMaxLines: 15,
    headbarEnabled: true,
    headbarTemplate: '§c%health%/%maxHealth%❤',
    headbarRefreshInterval: 1 * 20,
    actionbarEnabled: true,
    actionbarTemplate: '§eCPS: §f%cps% §2TPS: §f%tps% §bStatus: §f%status%',
    actionbarRefreshInterval: 2
  },
  helper: {
    enabled: true,
    //! nbtCommandEnabled: true
    //* noticeCmdEnabled: true,
    suicideCmdEnabled: true,
    backCmdEnabled: true,
    clockCmdEnabled: true,
    //* msguiCmdEnabled: true,
    hereCmdEnabled: true,
    loreCmdEnabled: true
    //! mapCmdEnabled: true
  },
  teleport: {
    enabled: true,
    tpaCmdEnabled: true,
    tpaExpireTime: 20,
    tprCmdEnabled: true,
    tprMaxDistance: 10000,
    tprMinDistance: 1000,
    tprEffectionSeconds: 35,
    homeCmdEnabled: true,
    homeMaxCount: 15,
    warpCmdEnabled: true
    //! transferCmdEnabled: true
  },
  /*   gui: {
    enabled: true
    //! menuCmdEnabled: true,
    //! menuCmdAlias: 'cd'
  }, */
  manager: {
    enabled: true,
    //* mangerCmdEnabled: true,
    vanishCmdEnabled: true,
    runasCmdEnabled: true,
    //* banCmdEnabled: true,
    //* cloudBlackCheckEnabled: true,
    //! skickCmdEnabled: true,
    //! crashCmdEnabled: true,
    //! stopCmdEnabled: true,
    infoCmdEnabled: true
    //* safeCmdEnabled: true
  }
  /* land: {
    enabled: true,
    maxBlockCount: 900000,
    buyPrice: 0.5,
    destPrice: 0.4
  },
  money: {
    enabled: true,
    // default: 0,
    scoreboardName: 'money',
    syncLLMoney: true,
    // payRate: 80,
    shopCmdEnabled: true,
    hunterEnabled: true
  }, */
  /*   hunter: [
    { entityId: 'minecraft:villager_v2', price: 100 },
    { entityId: 'minecraft:zombie', price: [100, 200] }
  ] as Array<{ entityId: string; price: number | [number, number] }>,
  shop: {
    默认分类: [
      { icon: 'textures/items/diamond.png', itemId: 'minecraft:diamond', text: '钻石', price: 100, type: 'buy' },
      { icon: 'textures/items/gold_ingot.png', itemId: 'minecraft:gold_ingot', text: '黄金', price: 500, type: 'sell' }
    ]
  } as Record<
    string,
    Array<{ icon?: string; text: string; count?: number; itemId: string; price: number; type: 'buy' | 'sell' }>
  > */
}
