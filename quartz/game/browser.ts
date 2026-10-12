import { GameRuntime } from "./runtime"
import type { GameCommand, GameState } from "./core"

export interface Wolke {
  execute(command: GameCommand): Promise<void>
  getSnapshot(): GameState
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
    execute: runtime.execute.bind(runtime),
    getSnapshot: runtime.getSnapshot.bind(runtime),
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
