export type Condition =
  | { type: "requires-item"; value: string; quantity?: number }
  | { type: "unless-item"; value: string }
  | { type: "requires-discovery"; value: string }
  | { type: "requires-clan"; clan: string; level: number }
  | { type: "requires-level"; level: number }

export interface WolkeRuntimeState {
  hasItem(id: string, quantity?: number): Promise<boolean>
  hasDiscovery(id: string): Promise<boolean>
  hasClanLevel(clan: string, level: number): Promise<boolean>
  hasLevel(level: number): Promise<boolean>
}

export async function evaluateCondition(
  condition: Condition,
  state: WolkeRuntimeState,
): Promise<boolean> {
  switch (condition.type) {
    case "requires-item": {
      const requiredItems = condition.value.split(",").map((item) => item.trim())
      if (requiredItems.some((item) => !item)) return false

      const itemAvailability = await Promise.all(
        requiredItems.map((item) => state.hasItem(item, condition.quantity)),
      )
      return itemAvailability.every(Boolean)
    }
    case "unless-item":
      return !(await state.hasItem(condition.value))
    case "requires-discovery":
      return state.hasDiscovery(condition.value)
    case "requires-clan":
      return state.hasClanLevel(condition.clan, condition.level)
    case "requires-level":
      return state.hasLevel(condition.level)
  }
}
