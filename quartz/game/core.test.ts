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

  test("collects a wing once with its source and timestamp", () => {
    const collected = applyCommand(
      EMPTY_GAME_STATE,
      {
        type: "wing_collected",
        wing: { id: "open-wings#block-0", name: "Treptow route", source: "/open-wings" },
      },
      123,
    )
    const duplicate = applyCommand(collected, {
      type: "wing_collected",
      wing: { id: "open-wings#block-0", name: "Treptow route", source: "/open-wings" },
    })

    assert.deepEqual(collected.wings, [
      {
        id: "open-wings#block-0",
        name: "Treptow route",
        source: "/open-wings",
        collectedAt: 123,
      },
    ])
    assert.equal(duplicate.wings.length, 1)
  })

  test("unlocks a discovery once", () => {
    const once = applyCommand(EMPTY_GAME_STATE, {
      type: "discovery_unlocked",
      discovery: "admiral7-meta-awareness",
    })
    const twice = applyCommand(once, {
      type: "discovery_unlocked",
      discovery: "admiral7-meta-awareness",
    })

    assert.deepEqual(twice.discoveries, ["admiral7-meta-awareness"])
  })

  test("increments experience for each exp event", () => {
    const first = applyCommand(EMPTY_GAME_STATE, { type: "exp_gained" })
    const second = applyCommand(first, { type: "exp_gained" })

    assert.equal(first.exp, 1)
    assert.equal(second.exp, 2)
  })

  test("persists fenced-block content without changing inventory", () => {
    const updated = applyCommand(EMPTY_GAME_STATE, {
      type: "block_updated",
      block: { id: "kokolores#block-0", content: "Kompass\nBrille" },
    })

    assert.deepEqual(updated.blocks, [{ id: "kokolores#block-0", content: "Kompass\nBrille" }])
    assert.equal(updated.items.length, 0)
  })

  test("counts discovered pages per location, not raw visits", () => {
    const first = applyCommand(
      EMPTY_GAME_STATE,
      {
        type: "location_visited",
        location: "kreuzberg",
        clan: "kreuzberg",
        page: "places/canteen-kreuzberg",
      },
      1000,
    )
    assert.equal(first.visits[0]?.count, 1)
    assert.deepEqual(first.visits[0]?.pages, ["places/canteen-kreuzberg"])
    assert.deepEqual(first.clans, { kreuzberg: 1 })

    // Revisiting the same page must refresh the timestamp but not the count.
    const revisited = applyCommand(
      first,
      {
        type: "location_visited",
        location: "kreuzberg",
        clan: "kreuzberg",
        page: "places/canteen-kreuzberg",
      },
      2000,
    )
    assert.equal(revisited.visits[0]?.count, 1)
    assert.equal(revisited.visits[0]?.lastVisitedAt, 2000)
    assert.deepEqual(revisited.clans, { kreuzberg: 1 })

    // A second, different page at the same location does count as a discovery.
    const second = applyCommand(
      revisited,
      {
        type: "location_visited",
        location: "kreuzberg",
        clan: "kreuzberg",
        page: "places/club-1",
      },
      3000,
    )
    assert.equal(second.visits[0]?.count, 2)
    assert.equal(second.visits.length, 1)
    assert.equal(second.visits[0]?.lastVisitedAt, 3000)
    assert.deepEqual(second.clans, { kreuzberg: 2 })

    const otherClan = applyCommand(
      second,
      { type: "location_visited", location: "neukölln", clan: "neukoelln", page: "places/club-2" },
      4000,
    )
    assert.deepEqual(otherClan.clans, { kreuzberg: 2, neukoelln: 1 })
  })

  test("keeps locations apart and rejects a blank location", () => {
    const state = applyCommand(EMPTY_GAME_STATE, {
      type: "location_visited",
      location: "mitte",
      clan: "mitte",
      page: "places/brandenburger-tor",
    })
    const other = applyCommand(state, {
      type: "location_visited",
      location: "kreuzberg",
      clan: "kreuzberg",
      page: "places/canteen-kreuzberg",
    })
    assert.equal(other.visits.length, 2)
    assert.equal(other.visits.find((visit) => visit.location === "kreuzberg")?.count, 1)
    assert.deepEqual(other.clans, { mitte: 1, kreuzberg: 1 })

    // A blank location is a programming error, not a no-op to swallow.
    assert.throws(
      () => applyCommand(other, { type: "location_visited", location: "  ", page: "x" }),
      /location and page/,
    )
  })

  test("rejects a persisted visit row that is not well formed", () => {
    assert.equal(
      isGameState({
        ...EMPTY_GAME_STATE,
        visits: [{ location: "mitte", pages: ["a"], count: 2, lastVisitedAt: 1 }],
      }),
      false,
    )
    assert.equal(isGameState({ ...EMPTY_GAME_STATE, visits: [{ location: "mitte" }] }), false)
    assert.equal(isGameState({ ...EMPTY_GAME_STATE, clans: { kreuzberg: -1 } }), false)
  })

  test("recognizes only valid persisted states and clones snapshots", () => {
    assert.equal(isGameState(EMPTY_GAME_STATE), true)
    assert.equal(isGameState({}), false)
    const copy = cloneState(EMPTY_GAME_STATE)
    copy.items.push({ id: "x", name: "x", source: "", quantity: 1, acquiredAt: 0 })
    assert.equal(EMPTY_GAME_STATE.items.length, 0)
  })
})
