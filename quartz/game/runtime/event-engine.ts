import type { ActionExecutor } from "./action-executor"
import type { Condition } from "./types"
import type { ConditionEvaluator } from "./condition-evaluator"
import type { GameState } from "./game-state"
import type { GameAction } from "./types"

export type GameEvent = {
  id: string
  trigger: string
  conditions?: Condition[]
  actions?: GameAction[]
  once?: boolean
}

export class EventEngine {
  private readonly events = new Map<string, GameEvent>()

  constructor(
    private readonly state: GameState,
    private readonly conditions: ConditionEvaluator,
    private readonly actions: ActionExecutor,
  ) {}

  register(event: GameEvent): void {
    this.events.set(event.id, event)
    console.log("[EventEngine] register", event)
    this.events.set(event.id, event)
  }

  async emit(trigger: string, context?: unknown): Promise<void> {
    console.log("[wolke event] emit", { trigger, context })

    for (const event of this.events.values()) {
      if (event.trigger !== trigger) continue
      if (event.once && this.state.flags[`event:${event.id}:completed`]) continue
      if (event.conditions && !(await this.conditions.all(event.conditions, context))) continue

      console.log("[wolke event] handle", event.id)
      await this.actions.execute(event.actions)
      if (event.once) this.state.flags[`event:${event.id}:completed`] = true
    }
  }

  getRegisteredEvents(): GameEvent[] {
    return [...this.events.values()]
  }
}
