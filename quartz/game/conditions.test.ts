import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { evaluateCondition, type WolkeRuntimeState } from "./conditions"

function state(
  clanLevel: number,
  items: string[] = [],
  quantities: Record<string, number> = {},
): WolkeRuntimeState {
  return {
    hasItem: async (id, quantity = 1) =>
      (quantities[id] ?? (items.includes(id) ? 1 : 0)) >= quantity,
    hasDiscovery: async () => false,
    hasClanLevel: async (_clan, level) => clanLevel >= level,
    hasLevel: async (level) => clanLevel >= level,
  }
}

describe("game conditions", () => {
  test("requires a minimum number of visited pages for a clan", async () => {
    const condition = { type: "requires-clan" as const, clan: "kreuzberg", level: 3 }

    assert.equal(await evaluateCondition(condition, state(2)), false)
    assert.equal(await evaluateCondition(condition, state(3)), true)
    assert.equal(await evaluateCondition(condition, state(4)), true)
  })

  test("requires a minimum experience level", async () => {
    const condition = { type: "requires-level" as const, level: 3 }

    assert.equal(await evaluateCondition(condition, state(3)), true)
    assert.equal(await evaluateCondition(condition, state(2)), false)
  })

  test("requires every comma-separated item", async () => {
    const condition = {
      type: "requires-item" as const,
      value: "ignition-chamber, stabilizing-fin, control-board",
    }

    assert.equal(
      await evaluateCondition(condition, state(0, ["ignition-chamber", "stabilizing-fin"])),
      false,
    )
    assert.equal(
      await evaluateCondition(
        condition,
        state(0, ["ignition-chamber", "stabilizing-fin", "control-board"]),
      ),
      true,
    )
  })

  test("requires a minimum item quantity", async () => {
    const condition = { type: "requires-item" as const, value: "heart", quantity: 5 }

    assert.equal(await evaluateCondition(condition, state(0, [], { heart: 4 })), false)
    assert.equal(await evaluateCondition(condition, state(0, [], { heart: 5 })), true)
  })
})
