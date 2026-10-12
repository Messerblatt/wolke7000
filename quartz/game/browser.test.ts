import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { getWolke } from "./browser"

describe("browser game accessor", () => {
  test("returns the same runtime for repeated initialization", async () => {
    const previousWindow = globalThis.window
    const values = new Map<string, string>()
    globalThis.window = {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    } as unknown as Window & typeof globalThis

    try {
      const first = getWolke()
      const second = getWolke()
      assert.strictEqual(first, second)

      await first.execute({ type: "item_taken", item: "Brille" })
      assert.equal(second.getSnapshot().items[0]?.name, "Brille")
    } finally {
      globalThis.window = previousWindow
    }
  })
})
