import type {
    Condition,
} from "../runtime/types"

import type {
    GameState
} from "../runtime/game-state"


import {
  ConditionEvaluator,
} from "../runtime/condition-evaluator"

import {
  ActionExecutor,
} from "../runtime/action-executor"

import  {
  GameAction
} from "../dialogue/dialogue-engine"

export type GameEvent = {
  id: string
  trigger: string
  conditions?: Condition[]
  actions: GameAction[]
  once?: boolean
}

class EventEngine {
  private events = new Map<string, GameEvent>()

  constructor(
    private state: GameState,
    private conditions: ConditionEvaluator,
    private actions: ActionExecutor,
  ) {}

  register(event: GameEvent): void {
  this.events.set(
    event.id,
    event,
  )
}

  async emit(trigger: string, context?: unknown) {
    for (const event of this.events.values()) {
      if (event.trigger !== trigger) continue

      if (
        event.once &&
        this.state.flags[
          `event:${event.id}:completed`
        ]
      ) {
        continue
      }

      if (
        event.conditions &&
        !(await this.conditions.all(
          event.conditions,
          context
        ))
      ) {
        continue
      }

      await this.actions.execute(event.actions)

      if (event.once) {
        this.state.flags[
          `event:${event.id}:completed`
        ] = true
      }
    }
  }
}
