import { world, Player, type Dimension } from '@minecraft/server'
import { homes, warps, type Position } from './types'

// 获取维度对象
function getDimension(dimensionId: number): Dimension {
  switch (dimensionId) {
    case 0:
      return world.getDimension('overworld')
    case 1:
      return world.getDimension('nether')
    case 2:
      return world.getDimension('the_end')
    default:
      return world.getDimension('overworld')
  }
}

// 获取玩家位置
function getPlayerPosition(player: Player): Position {
  const location = player.location
  const dimensionId = player.dimension.id === 'overworld' ? 0 : player.dimension.id === 'nether' ? 1 : 2
  return {
    dimension: dimensionId,
    x: location.x,
    y: location.y,
    z: location.z
  }
}

// 处理命令
world.beforeEvents.chatSend.subscribe((event) => {
  console.log(JSON.stringify(event, null, 2))
  event.sender.sendMessage('hi')
  const message = event.message
  const player = event.sender

  if (!player || !(player instanceof Player)) return

  const args = message.trim().split(' ')
  const command = args[0].toLowerCase()

  switch (command) {
    case '!sethome':
      if (args.length < 2) {
        player.sendMessage('用法: !sethome <名称>')
        return
      }
      const homeName = args[1]
      const pos = getPlayerPosition(player)
      if (!homes[player.name]) {
        homes[player.name] = {}
      }
      homes[player.name][homeName] = pos
      player.sendMessage(`已设置家园 '${homeName}'`)
      event.cancel = true
      break

    case '!home':
      if (args.length < 2) {
        player.sendMessage('用法: !home <名称>')
        return
      }
      const homeToGo = args[1]
      const homePos = homes[player.name]?.[homeToGo]
      if (homePos) {
        teleportPlayer(player, homePos)
        player.sendMessage(`已传送到家园 '${homeToGo}'`)
      } else {
        player.sendMessage(`未找到名为 '${homeToGo}' 的家园`)
      }
      event.cancel = true
      break

    case '!setwarp':
      if (args.length < 2) {
        player.sendMessage('用法: !setwarp <名称>')
        return
      }
      const warpName = args[1]
      const warpPos = getPlayerPosition(player)
      warps[warpName] = warpPos
      player.sendMessage(`已设置传送点 '${warpName}'`)
      event.cancel = true
      break

    case '!warp':
      if (args.length < 2) {
        player.sendMessage('用法: !warp <名称>')
        return
      }
      const warpToGo = args[1]
      const position = warps[warpToGo]
      if (position) {
        player.teleport(
          { x: position.x, y: position.y, z: position.z },
          {
            dimension: getDimension(position.dimension),
            facingLocation: position
          }
        )
        player.sendMessage(`已传送到 '${warpToGo}'`)
      } else {
        player.sendMessage(`未找到名为 '${warpToGo}' 的传送点`)
      }
      event.cancel = true
      break

    default:
      break
  }
})
