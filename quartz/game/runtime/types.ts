export type Condition =
  | {
      type: "has-item"
      itemId: string
    }
  | {
      type: "state-equals"
      key: string
      value: string | number | boolean
    }
  | {
      type: "character-flag"
      characterId: string
      key: string
      value?: boolean
    }
  | {
      type: "context-equals"
      key: string
      value: string | number | boolean
    }

export type GameAction =
  | {
      type: "set-state"
      key: string
      value: string | number | boolean
    }
  | {
      type: "set-character-flag"
      characterId: string
      key: string
      value: boolean
    }
  | {
      type: "relationship-change"
      characterId: string
      amount: number
    }
  | {
      type: "give-item"
      itemId: string
    }
  | {
      type: "remove-item"
      itemId: string
    }
