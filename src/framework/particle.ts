import { type Player, type Vector3, system } from '@minecraft/server'
// TODO: 一次之物 不必两次
export class ParticleDrawer {
  private timer?: number

  public constructor(
    private readonly player: Player,
    private readonly particle: string,
    private readonly interval = 100,
    private readonly duration = 5000
  ) {}

  private spawnParticle(pos: Vector3) {
    // this.player.spawnParticle(this.particle, pos)
    this.player.runCommand(`particle ${this.particle} ${pos.x} ${pos.y} ${pos.z}`)
  }

  public drawLine(start: Vector3, end: Vector3, steps = 20) {
    for (let count = 0; count < steps; count++) {
      const dx = (end.x - start.x) / steps
      const dy = (end.y - start.y) / steps
      const dz = (end.z - start.z) / steps
      const pos = {
        x: start.x + dx * count,
        y: start.y + dy * count,
        z: start.z + dz * count
      }
      this.spawnParticle(pos)
    }

    this.timer = system.runInterval(() => {
      this.drawLine(start, end, steps)
    }, this.interval)
    system.runTimeout(() => {
      this.stop()
    }, this.duration)
  }

  public drawCircle(center: Vector3, radius: number, axis: 'x' | 'y' | 'z' = 'y', points = 36) {
    for (let count = 0; count < points; count++) {
      const angle = (2 * Math.PI * count) / points
      let pos: Vector3
      switch (axis) {
        case 'x':
          pos = {
            x: center.x,
            y: center.y + radius * Math.cos(angle),
            z: center.z + radius * Math.sin(angle)
          }
          break
        case 'y':
          pos = {
            x: center.x + radius * Math.cos(angle),
            y: center.y,
            z: center.z + radius * Math.sin(angle)
          }
          break
        case 'z':
          pos = {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
            z: center.z
          }
          break
      }
      this.spawnParticle(pos)
    }

    this.timer = system.runInterval(() => {
      this.drawCircle(center, radius, axis, points)
    }, this.interval)
    system.runTimeout(() => {
      this.stop()
    }, this.duration)
  }

  public drawSphere(center: Vector3, radius: number, points = 100) {
    for (let count = 0; count < points; count++) {
      const phi = Math.acos(1 - 2 * (count / points))
      const theta = Math.PI * (1 + Math.sqrt(5)) * count
      const y = center.y + radius * Math.sin(theta) * Math.sin(phi)
      const z = center.z + radius * Math.cos(phi)
      this.spawnParticle({ x: center.x + radius * Math.cos(theta) * Math.sin(phi), y, z })
    }

    this.timer = system.runInterval(() => {
      this.drawSphere(center, radius, points)
    }, this.interval)
    system.runTimeout(() => {
      this.stop()
    }, this.duration)
  }

  public stop() {
    if (this.timer) {
      system.clearRun(this.timer)
    }
  }
}
