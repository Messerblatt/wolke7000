import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { EMPTY_GAME_STATE, applyCommand, cloneState, isGameState } from "./core"

describe("game core", () => {
  test("places and takes quantities without mutating the input", () => {
    const taken = applyCommand(EMPTY_GAME_STATE, {
      type: "item_taken",
      item: { name: "Kompass", source: "/kokolores" },
    })
    const more = applyCommand(taken, { type: "item_taken", item: "Kompass" })
    const placed = applyCommand(more, { type: "item_placed", item: "Kompass" })

    assert.equal(EMPTY_GAME_STATE.items.length, 0)
    assert.equal(more.items[0]?.quantity, 2)
    assert.equal(placed.items[0]?.quantity, 1)
  })

  test("unlocks a chapter once", () => {
    const once = applyCommand(EMPTY_GAME_STATE, { type: "chapter_unlocked", chapter: "intro" })
    const twice = applyCommand(once, { type: "chapter_unlocked", chapter: "intro" })
    assert.deepEqual(twice.unlockedChapters, ["intro"])
  })

  test("persists fenced-block content without changing inventory", () => {
    const updated = applyCommand(EMPTY_GAME_STATE, {
      type: "block_updated",
      block: { id: "kokolores#block-0", content: "Kompass\nBrille" },
    })

    assert.deepEqual(updated.blocks, [{ id: "kokolores#block-0", content: "Kompass\nBrille" }])
    assert.equal(updated.items.length, 0)
  })

  test("recognizes only valid persisted states and clones snapshots", () => {
    assert.equal(isGameState(EMPTY_GAME_STATE), true)
    assert.equal(isGameState({}), false)
    const copy = cloneState(EMPTY_GAME_STATE)
    copy.items.push({ id: "x", name: "x", source: "", quantity: 1, acquiredAt: 0 })
    assert.equal(EMPTY_GAME_STATE.items.length, 0)
  })
})
