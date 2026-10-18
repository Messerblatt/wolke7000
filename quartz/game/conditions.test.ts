import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { evaluateCondition, type WolkeRuntimeState } from "./conditions"

function state(clanLevel: number, items: string[] = []): WolkeRuntimeState {
  return {
    hasItem: async (id) => items.includes(id),
    hasDiscovery: async () => false,
    hasClanLevel: async (_clan, level) => clanLevel >= level,
  }
}

describe("game conditions", () => {
  test("requires a minimum number of visited pages for a clan", async () => {
    const condition = { type: "requires-clan" as const, clan: "kreuzberg", level: 3 }

    assert.equal(await evaluateCondition(condition, state(2)), false)
    assert.equal(await evaluateCondition(condition, state(3)), true)
    assert.equal(await evaluateCondition(condition, state(4)), true)
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
})
