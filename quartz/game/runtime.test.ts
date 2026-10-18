import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { GameRuntime } from "./runtime"
import { GAME_STORAGE_KEY, loadGameState, type GameStorage } from "./storage"

function memoryStorage(): GameStorage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

describe("game runtime", () => {
  test("returns one snapshot per subscriber and protects internal state", async () => {
    const runtime = new GameRuntime()
    const received: number[] = []

    const unsubscribe = runtime.subscribe((snapshot) => {
      received.push(snapshot.items.length)
      snapshot.items.push({ id: "bad", name: "bad", source: "", quantity: 1, acquiredAt: 0 })
    })

    await runtime.execute({ type: "item_taken", item: "Brille" })
    assert.equal(runtime.getSnapshot().items.length, 1)
    assert.deepEqual(received, [0, 1])
    unsubscribe()
  })

  test("persists progress and serializes commands", async () => {
    const storage = memoryStorage()
    const first = new GameRuntime({ storage })
    await Promise.all([
      first.execute({ type: "item_taken", item: "Brille" }),
      first.execute({ type: "item_taken", item: "Brille" }),
    ])

    const second = new GameRuntime({ storage })
    assert.equal(second.getSnapshot().items[0]?.quantity, 2)
  })

  test("reset returns the runtime to the empty initial state", async () => {
    const runtime = new GameRuntime({ storage: memoryStorage() })
    await runtime.execute({ type: "item_taken", item: "Kompass" })
    await runtime.execute({
      type: "block_updated",
      block: { id: "page#block-0", content: "Kompass" },
    })

    await runtime.reset()
    assert.deepEqual(runtime.getSnapshot().items, [])
    assert.deepEqual(runtime.getSnapshot().blocks, [])
    assert.deepEqual(runtime.getSnapshot().unlockedChapters, [])
  })

  test("ignores malformed storage and migrates the previous inventory key", () => {
    const malformed: GameStorage = {
      getItem: () => "not json",
      setItem: () => undefined,
    }
    assert.equal(loadGameState(malformed).items.length, 0)

    const legacy: GameStorage = {
      getItem: (key) =>
        key === GAME_STORAGE_KEY
          ? null
          : JSON.stringify([
              { id: "legacy-id", name: "Kompass", source: "/cellar", acquiredAt: 10 },
            ]),
      setItem: () => undefined,
    }
    const migrated = loadGameState(legacy)
    assert.equal(migrated.items[0]?.name, "Kompass")
    assert.equal(migrated.items[0]?.id, "legacy-id")
  })
})
