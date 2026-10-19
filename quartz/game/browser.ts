import { GameRuntime } from "./runtime"
import type {
  GameCommand,
  GameLetter,
  GameState,
  GameVisit,
  GameWing,
  InventoryEntry,
  Pigeon,
  VolierClaims,
} from "./core"

export interface Wolke {
  execute(command: GameCommand): Promise<void>
  getSnapshot(): GameState
  readonly inventory: InventoryEntry[]
  readonly letters: GameLetter[]
  readonly pigeons: Pigeon[]
  readonly volierClaims: VolierClaims
  readonly wings: GameWing[]
  readonly discoveries: string[]
  readonly exp: number
  /** Locations the reader has discovered pages in, with discovery counts. */
  readonly visits: GameVisit[]
  /** Distinct visited pages grouped by clan. */
  readonly clans: Record<string, number>
  /** Distinct pages discovered at a location. 0 when the location is unknown. */
  getVisitCount(location: string): number
  /** Distinct pages discovered for a clan. 0 when the clan is unknown. */
  getClanVisitCount(clan: string): number
  /** Timestamp of the most recent visit to a location, or null if unknown. */
  getLastVisit(location: string): number | null
  subscribe(listener: (snapshot: GameState) => void): () => void
  reset(): Promise<void>
}

declare global {
  interface Window {
    wolke?: Wolke
  }
}

function browserStorage() {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function notifyItemPickedUp(command: GameCommand): void {
  if (command.type !== "item_taken" || typeof window === "undefined") return
  if (typeof window.dispatchEvent !== "function" || typeof CustomEvent === "undefined") return

  const item = command.item
  const name = typeof item === "string" ? item.trim() : item.name.trim()
  if (!name) return

  window.dispatchEvent(
    new CustomEvent("wolke7000:item-picked-up", {
      detail: {
        name,
        quantity: typeof item === "string" ? undefined : item.quantity,
      },
    }),
  )
}

function notifyExperienceGained(command: GameCommand, runtime: GameRuntime): void {
  if (command.type !== "exp_gained" || typeof window === "undefined") return
  if (typeof window.dispatchEvent !== "function" || typeof CustomEvent === "undefined") return

  const exp = runtime.getSnapshot().exp
  window.dispatchEvent(new CustomEvent("wolke7000:exp-gained", { detail: { exp } }))
  if (exp > 0 && exp % 5 === 0) {
    window.dispatchEvent(new CustomEvent("wolke7000:level-up", { detail: { exp } }))
  }
}

async function clearRucksackStorage(): Promise<void> {
  try {
    localStorage.removeItem("quartz:rucksack")
    localStorage.removeItem("wolke7000.inventory.v1")
  } catch {
    // Storage can be disabled in private browsing.
  }

  if (typeof indexedDB === "undefined") return

  await new Promise<void>((resolve) => {
    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open("quartz:rucksack:db")
    } catch {
      resolve()
      return
    }

    request.onerror = () => resolve()
    request.onsuccess = () => {
      const db = request.result
      const stores = ["entries", "meta"].filter((name) => db.objectStoreNames.contains(name))
      if (stores.length === 0) {
        db.close()
        resolve()
        return
      }

      try {
        const transaction = db.transaction(stores, "readwrite")
        for (const store of stores) transaction.objectStore(store).clear()
        transaction.oncomplete = () => {
          db.close()
          resolve()
        }
        transaction.onerror = () => {
          db.close()
          resolve()
        }
        transaction.onabort = () => {
          db.close()
          resolve()
        }
      } catch {
        db.close()
        resolve()
      }
    }
  })
}

/** Return the one game runtime shared by every page script in this window. */
export function getWolke(): Wolke {
  if (typeof window === "undefined") {
    throw new Error("getWolke() is only available in a browser")
  }

  if (window.wolke) return window.wolke

  const runtime = new GameRuntime({ storage: browserStorage() })
  const wolke: Wolke = {
    execute: async (command) => {
      await runtime.execute(command)
      notifyItemPickedUp(command)
      notifyExperienceGained(command, runtime)
    },
    getSnapshot: runtime.getSnapshot.bind(runtime),
    get inventory() {
      const snapshot = runtime.getSnapshot()
      return [...snapshot.items, ...snapshot.letters]
    },
    get letters() {
      return runtime.getSnapshot().letters
    },
    get pigeons() {
      return runtime.getSnapshot().pigeons
    },
    get volierClaims() {
      return runtime.getSnapshot().volierClaims
    },
    get wings() {
      return runtime.getSnapshot().wings
    },
    get discoveries() {
      return runtime.getSnapshot().discoveries
    },
    get exp() {
      return runtime.getSnapshot().exp
    },
    get visits() {
      return runtime.getSnapshot().visits
    },
    get clans() {
      return runtime.getSnapshot().clans
    },
    getVisitCount(location: string): number {
      return runtime.getSnapshot().visits.find((visit) => visit.location === location)?.count ?? 0
    },
    getClanVisitCount(clan: string): number {
      return runtime.getSnapshot().clans[clan] ?? 0
    },
    getLastVisit(location: string): number | null {
      return (
        runtime.getSnapshot().visits.find((visit) => visit.location === location)?.lastVisitedAt ??
        null
      )
    },
    subscribe: runtime.subscribe.bind(runtime),
    reset: async () => {
      await runtime.reset()
      await clearRucksackStorage()
      window.location.reload()
    },
  }
  window.wolke = wolke
  return wolke
}
