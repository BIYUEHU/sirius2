import { command } from './framework/command'
import { sendAdvancedModalForm, sendModalForm } from './framework/gui'
import { itemUse } from './framework/itemUse'
import { ParticleDrawer } from './framework/particle'

command('test <arg> <arg2:number> [arg3:boolean]')
  .descr('test command')
  .action((_, ...args) => JSON.stringify(args, null, 2))

command('hi').action(() => 'hello mini world!')

command('ab').action((pl) => pl.getTags())

command('c1').action(async () => CONFIG)
command('c2').action(() => CONFIG)

itemUse('minecraft:clock', (pl) => {
  return 'hi you used a clock'
})

command('d1 [damage:number]').action((pl, [d]) => {
  pl.applyDamage(d ?? 0)
  return 'damage applied'
})

command('d2 [damage:number]').action((pl, [d]) => {
  pl.runCommand(`damage "${pl.name}" ${d ?? 0}`).successCount
  return 'damage applied'
})

command('g1').action((pl) => {
  sendModalForm(
    pl,
    'test form',
    'here is the content',
    (pl) => 'confirmed',
    (pl) => 'cancelled'
  )
})

itemUse('minecraft:apple', (pl) => {
  sendAdvancedModalForm(
    pl,
    'test form',
    'here is the content',
    (pl) => 'confirmed',
    (pl) => 'cancelled'
  )
})

command('p <name> <type:number> [i:number] [duration:number]').action((pl, [name, type, i, d]) => {
  const p = new ParticleDrawer(pl, name, i ?? 100, d ?? 5000)
  if (type === 1) {
    p.drawLine({ ...pl.location, x: pl.location.x - 10 }, { ...pl.location, x: pl.location.x + 10 })
  } else if (type === 2) {
    p.drawCircle({ ...pl.location, x: pl.location.x - 10 }, 5)
  } else if (type === 3) {
    p.drawSphere({ ...pl.location, x: pl.location.x - 10 }, 5)
  }
})
