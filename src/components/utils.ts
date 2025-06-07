import { system, world } from '@minecraft/server'
import { Command } from '../framework/command'
import { TargetEntity, betterTell, t2, t2PlayerObjProvider } from '../framework/utils'
import { NametagManager, SidebarManager } from '../framework/display'

world.afterEvents.playerSpawn.subscribe((event) => {
  if (!event.initialSpawn) return
  event.player.sendMessage(t2('§6§lWelcome to the server, §a%name%!§r', t2PlayerObjProvider(event.player)))
})

world.beforeEvents.chatSend.subscribe((event) => {
  if (event.message.startsWith(Command.COMMAND_PREFIX)) return
  event.cancel = true
  system.run(() =>
    betterTell(
      t2(
        '§l§e%y%-%m%-%d%§r §g§l%h%:%min%:%s%§r §r§l[§a%dim% §r§l| §l§c%health%❤ §r§l| §6%gamemode%§r§l] §r%name%: %msg%',
        Object.assign(t2PlayerObjProvider(event.sender), { msg: event.message })
      ),
      TargetEntity.ALL
    )
  )
})

const sidebarManager = new SidebarManager({
  title: '§6§l=== Server Info ===',
  refreshIntervalSeconds: 1,
  maxLines: 15
})

const nametagManager = new NametagManager({
  refreshIntervalSeconds: 2,
  template: '§c%health%/%maxHealth%❤'
})

sidebarManager.setTemplates([
  '',
  '§aNam: §f%name%',
  '§bPos: §f%x%, %y%, %z%',
  '§cHlt: §f%health%/%maxHealth%',
  '§eLvl: §f%level% (XP: %xp%)',
  '§dDim: §f%dim%',
  '§9Spd: §f%speed%',
  '',
  '§7Time: §f%h%:%min%:%s%',
  '§7Online: §f%onlineCount%',
  '',
  '§6§oWelcome to the server!'
])

world.afterEvents.playerSpawn.subscribe((event) => {
  system.run(() => {
    nametagManager.start()
    sidebarManager.start()
  })
})
