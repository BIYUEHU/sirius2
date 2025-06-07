import {
  type Player,
  world,
  system,
  type ScoreboardObjective,
  DisplaySlotId,
  ScoreboardIdentityType
} from '@minecraft/server'
import { t2, t2PlayerObjProvider } from './utils'

export interface SidebarConfig {
  title: string
  refreshIntervalSeconds: number
  maxLines: number
}

// 头顶显示配置
export interface NametagConfig {
  refreshIntervalSeconds: number
  template: string
}

export class SidebarManager {
  private static readonly OBJECTIVE_NAME = 'sirius2_sidebar'

  private templates: string[] = []
  private customData: Record<string, string | number | boolean> = {}
  private objective?: ScoreboardObjective
  private refreshId?: number
  private isInitialized = false

  public constructor(private readonly config: SidebarConfig) {}

  public start() {
    if (this.isInitialized) return
    this.initializeObjective()
    this.startRefreshLoop()
    this.refreshAllPlayers()
    this.isInitialized = true
  }

  private initializeObjective(): void {
    try {
      world.getPlayers()[0].runCommand(`scoreboard objectives add "${SidebarManager.OBJECTIVE_NAME}" dummy`)
    } catch {}

    try {
      this.objective = world.scoreboard.getObjective(SidebarManager.OBJECTIVE_NAME)
    } catch {
      this.objective = world.scoreboard.addObjective(SidebarManager.OBJECTIVE_NAME, this.config.title)
    }

    if (this.objective) {
      world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
        objective: this.objective
      })
    }
  }

  public setTemplates(templates: string[], refresh = false): void {
    this.templates = templates
    if (refresh) this.refreshAllPlayers()
  }

  public setCustomData(data: Record<string, string | number | boolean>): void {
    this.customData = { ...this.customData, ...data }
  }

  public setTitle(title: string, refresh = false): void {
    this.config.title = title
    if (refresh) this.updateTitle()
  }

  private updateTitle(): void {
    if (!this.objective) return

    try {
      world.scoreboard.removeObjective(SidebarManager.OBJECTIVE_NAME)
      this.objective = world.scoreboard.addObjective(
        SidebarManager.OBJECTIVE_NAME,
        t2(this.config.title, this.customData)
      )
      world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
        objective: this.objective
      })
      this.refreshAllPlayers()
    } catch (error) {
      console.warn('Failed to update sidebar title:', error)
    }
  }

  public refreshPlayer(player: Player): void {
    if (!this.objective || this.templates.length === 0) return

    try {
      const participants = this.objective.getParticipants()
      for (const participant of participants) {
        if (participant.type === ScoreboardIdentityType.Player && participant.getEntity()?.id === player.id) {
          this.objective.removeParticipant(participant)
        }
      }

      const combinedData = { ...this.customData, ...t2PlayerObjProvider(player) }

      this.templates.map((template, index) => {
        if (index >= this.config.maxLines) return
        try {
          this.objective?.setScore(`§r${t2(template, combinedData)}`, this.templates.length - index)
        } catch (error) {
          console.warn(`Failed to set score for line ${index}:`, error)
        }
      })
    } catch (error) {
      console.warn('Failed to refresh player sidebar:', error)
    }
  }

  public refreshAllPlayers(): void {
    for (const player of world.getPlayers()) {
      this.refreshPlayer(player)
    }
  }

  private startRefreshLoop(): void {
    if (this.refreshId !== undefined) {
      system.clearRun(this.refreshId)
    }

    const intervalTicks = this.config.refreshIntervalSeconds * 20
    this.refreshId = system.runInterval(() => {
      this.updateTitle()
      this.refreshAllPlayers()
    }, intervalTicks)
  }

  public setRefreshInterval(seconds: number): void {
    this.config.refreshIntervalSeconds = seconds
    this.startRefreshLoop()
  }

  public stop(): void {
    if (this.refreshId !== undefined) {
      system.clearRun(this.refreshId)
      this.refreshId = undefined
    }
  }

  public destroy(): void {
    this.stop()
    if (this.objective) {
      try {
        world.scoreboard.removeObjective(SidebarManager.OBJECTIVE_NAME)
      } catch (error) {
        console.warn('Failed to remove objective:', error)
      }
    }
  }
}

export class NametagManager {
  private customData: Record<string, string | number | boolean> = {}
  private refreshId?: number
  private isInitialized = false

  public constructor(private readonly config: NametagConfig) {}

  public start(): void {
    if (this.isInitialized) return
    this.startRefreshLoop()
    this.refreshAllPlayers()
    this.isInitialized = true
  }

  public setTemplate(template: string): void {
    this.config.template = template
  }

  public setCustomData(data: Record<string, string | number | boolean>): void {
    this.customData = { ...this.customData, ...data }
  }

  public refreshPlayer(player: Player): void {
    try {
      player.nameTag = t2(
        this.config.template,
        Object.assign(t2PlayerObjProvider(player), Object.assign(t2PlayerObjProvider(player), this.customData))
      )
    } catch (error) {
      console.warn('Failed to refresh player nametag:', error)
    }
  }

  public refreshAllPlayers(): void {
    for (const player of world.getPlayers()) this.refreshPlayer(player)
  }

  private startRefreshLoop(): void {
    if (this.refreshId !== undefined) system.clearRun(this.refreshId)

    const intervalTicks = this.config.refreshIntervalSeconds * 20
    this.refreshId = system.runInterval(() => {
      this.refreshAllPlayers()
    }, intervalTicks)
  }

  public setRefreshInterval(seconds: number): void {
    this.config.refreshIntervalSeconds = seconds
    this.startRefreshLoop()
  }

  public stop(): void {
    if (this.refreshId === undefined) return
    system.clearRun(this.refreshId)
    this.refreshId = undefined
  }

  public destroy(): void {
    this.stop()
  }
}
