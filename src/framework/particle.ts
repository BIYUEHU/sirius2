import { type Player, type Vector3, system } from '@minecraft/server'
import { toVector3 } from './utils'

export class ParticleDrawer {
  private timer?: number

  public constructor(
    private readonly player: Player,
    private readonly particle: string,
    private readonly interval = 100,
    private readonly duration = 5000
  ) {}

  private spawnParticle(pos: Vector3) {
    this.player.spawnParticle(this.particle, pos)
  }

  public drawLine(start: Vector3, end: Vector3, steps = 20) {
    this.timer = system.runInterval(() => {
      for (let count = 0; count < steps; count++) {
        this.spawnParticle(
          toVector3(
            start.x + ((end.x - start.x) / steps) * count,
            start.y + ((end.y - start.y) / steps) * count,
            start.z + ((end.z - start.z) / steps) * count
          )
        )
      }
    }, this.interval)
    system.runTimeout(() => {
      this.stop()
    }, this.duration)
  }

  public drawCircle(center: Vector3, radius: number, axis: 'x' | 'y' | 'z' = 'y', points = 36) {
    this.timer = system.runInterval(() => {
      for (let count = 0; count < points; count++) {
        const angle = (2 * Math.PI * count) / points
        switch (axis) {
          case 'x':
            this.spawnParticle(
              toVector3(center.x, center.y + radius * Math.cos(angle), center.z + radius * Math.sin(angle))
            )
            break
          case 'y':
            this.spawnParticle(
              toVector3(center.x + radius * Math.cos(angle), center.y, center.z + radius * Math.sin(angle))
            )
            break
          case 'z':
            this.spawnParticle(
              toVector3(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle), center.z)
            )
            break
        }
      }
    }, this.interval)
    system.runTimeout(() => {
      this.stop()
    }, this.duration)
  }

  public drawSphere(center: Vector3, radius: number, points = 50) {
    this.timer = system.runInterval(() => {
      for (let count = 0; count < points; count++) {
        const phi = Math.acos(1 - 2 * (count / points))
        const theta = Math.PI * (1 + Math.sqrt(5)) * count
        this.spawnParticle(
          toVector3(
            center.x + radius * Math.cos(theta) * Math.sin(phi),
            center.y + radius * Math.sin(theta) * Math.sin(phi),
            center.z + radius * Math.cos(phi)
          )
        )
      }
    }, this.interval)
    system.runTimeout(() => {
      this.stop()
    }, this.duration)
  }

  public stop() {
    if (this.timer) system.clearRun(this.timer)
  }
}
