import type { GameAction } from "./types"
import type { GameState } from "./game-state"

export interface InventoryWriter {
  add(itemId: string): Promise<void>
  remove(itemId: string): Promise<void>
}

export class ActionExecutor {
  constructor(
    private state: GameState,
    private inventory: InventoryWriter,
  ) {}

  async execute(actions: GameAction[] = []): Promise<void> {
    for (const action of actions) {
      await this.executeOne(action)
    }
  }

  private async executeOne(action: GameAction): Promise<void> {
    switch (action.type) {
      case "set-state":
        this.state.flags[action.key] = action.value
        return

      case "set-character-flag": {
        const character = this.ensureCharacter(action.characterId)

        character.flags[action.key] = action.value

        return
      }

      case "relationship-change": {
        const character = this.ensureCharacter(action.characterId)

        character.relationship += action.amount

        return
      }

      case "give-item":
        await this.inventory.add(action.itemId)
        return

      case "remove-item":
        await this.inventory.remove(action.itemId)
        return
    }
  }

  private ensureCharacter(characterId: string) {
    if (!this.state.characters[characterId]) {
      this.state.characters[characterId] = {
        relationship: 0,
        flags: {},
      }
    }

    return this.state.characters[characterId]
  }
}
