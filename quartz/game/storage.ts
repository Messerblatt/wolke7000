import {
  EMPTY_GAME_STATE,
  GAME_STATE_VERSION,
  cloneState,
  isGameState,
  normalizeItem,
  type GameState,
} from "./core"

export const GAME_STORAGE_KEY = "wolke7000.game.v1"
export const LEGACY_INVENTORY_STORAGE_KEY = "wolke7000.inventory.v1"

export interface GameStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function parseState(raw: string | null): GameState | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isGameState(parsed) ? cloneState(parsed) : null
  } catch {
    return null
  }
}

function migrateLegacyInventory(storage: GameStorage): GameState | null {
  const raw = storage.getItem(LEGACY_INVENTORY_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null

    const items = parsed
      .map((entry) => {
        if (typeof entry !== "object" || entry === null) return null
        const value = entry as Record<string, unknown>
        return normalizeItem(
          {
            id: typeof value.id === "string" ? value.id : undefined,
            name: typeof value.name === "string" ? value.name : "",
            source: typeof value.source === "string" ? value.source : "",
          },
          typeof value.acquiredAt === "number" ? value.acquiredAt : Date.now(),
        )
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    return { version: GAME_STATE_VERSION, items, blocks: [], unlockedChapters: [] }
  } catch {
    return null
  }
}

export function loadGameState(storage: GameStorage | null): GameState {
  if (!storage) return cloneState(EMPTY_GAME_STATE)

  try {
    return (
      parseState(storage.getItem(GAME_STORAGE_KEY)) ??
      migrateLegacyInventory(storage) ??
      cloneState(EMPTY_GAME_STATE)
    )
  } catch {
    return cloneState(EMPTY_GAME_STATE)
  }
}

export function saveGameState(storage: GameStorage | null, state: GameState): boolean {
  if (!storage) return false
  try {
    storage.setItem(
      GAME_STORAGE_KEY,
      JSON.stringify({ ...cloneState(state), version: GAME_STATE_VERSION }),
    )
    return true
  } catch {
    return false
  }
}
