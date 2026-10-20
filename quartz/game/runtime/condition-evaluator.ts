import type { Condition } from "./types"
import type { GameState } from "./game-state"

export interface InventoryReader {
  has(itemId: string): Promise<boolean>
}

export class ConditionEvaluator {
  constructor(
    private state: GameState,
    private inventory: InventoryReader,
  ) {}

  async evaluate(
    condition: Condition,
    context?: unknown,
  ): Promise<boolean> {
    switch (condition.type) {
      case "has-item":
        return this.inventory.has(condition.itemId)

      case "state-equals":
        return (
          this.state.flags[condition.key] ===
          condition.value
        )

      case "character-flag": {
        const character =
          this.state.characters[
            condition.characterId
          ]

        if (!character) {
          return false
        }

        const expected =
          condition.value ?? true

        return (
          character.flags[condition.key] ===
          expected
        )
      }
      case "context-equals": {
  if (
    typeof context !== "object" ||
    context === null
  ) {
    return false
  }

  const record =
    context as Record<string, unknown>

  return (
    record[condition.key] ===
    condition.value
  )
}

      default:
        return false
    }
  }

  async all(
    conditions: Condition[] = [],
    context?: unknown,
  ): Promise<boolean> {
    for (const condition of conditions) {
      const result =
        await this.evaluate(
          condition,
          context,
        )

      if (!result) {
        return false
      }
    }

    return true
  }
}