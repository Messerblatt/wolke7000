export type CharacterState = {
  relationship: number
  flags: Record<string, boolean>
}

export type GameState = {
  flags: Record<string, string | number | boolean>

  visitedLocations: Set<string>

  characters: Record<string, CharacterState>

  dialogue: {
    completed: Set<string>
  }
}

export function createInitialGameState(): GameState {
  return {
    flags: {},

    visitedLocations: new Set(),

    characters: {
      koko: {
        relationship: 0,
        flags: {},
      },

      fibo: {
        relationship: 0,
        flags: {},
      },

      spasti: {
        relationship: 0,
        flags: {},
      },
    },

    dialogue: {
      completed: new Set(),
    },
  }
}