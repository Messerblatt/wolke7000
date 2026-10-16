/**
 * Environment-independent game model.
 *
 * This module deliberately knows nothing about the browser, Quartz, storage,
 * or the DOM. It can therefore become the authoritative rules module for a
 * server runtime later.
 */

export const GAME_STATE_VERSION = 1 as const

export type GameItem = {
  id: string
  name: string
  source: string
  quantity: number
  acquiredAt: number
}

export type GameWing = {
  id: string
  name: string
  source: string
  collectedAt: number
}

/**
 * A location the reader has discovered pages in.
 *
 * `pages` is the set of distinct page slugs carrying that location, and is the
 * source of truth: `count` is derived from it. Revisiting a page therefore
 * never inflates the count - only genuinely new pages at that location do.
 * `lastVisitedAt` still updates on every visit, so "when was the reader last
 * here" stays answerable independently of discovery.
 */
export type GameVisit = {
  location: string
  pages: string[]
  count: number
  lastVisitedAt: number
}

export type GameState = {
  version: typeof GAME_STATE_VERSION
  items: GameItem[]
  wings: GameWing[]
  discoveries: string[]
  blocks: GameBlock[]
  unlockedChapters: string[]
  visits: GameVisit[]
}

export type GameBlock = {
  id: string
  content: string
}

export type GameBlockInput = {
  id: string
  content: string
}

export type ItemInput =
  | string
  | {
      id?: string
      name: string
      source?: string
      quantity?: number
    }

export type WingInput =
  | string
  | {
      id?: string
      name: string
      source?: string
    }

export type GameCommand =
  | { type: "item_placed"; item: ItemInput }
  | { type: "item_taken"; item: ItemInput }
  | { type: "items_synchronized"; items: ItemInput[] }
  | { type: "wing_collected"; wing: WingInput }
  | { type: "discovery_unlocked"; discovery: string }
  | { type: "blocks_synchronized"; blocks: GameBlockInput[] }
  | { type: "block_updated"; block: GameBlockInput }
  | { type: "chapter_unlocked"; chapter: string }
  | { type: "location_visited"; location: string; page: string }

export const EMPTY_GAME_STATE: GameState = {
  version: GAME_STATE_VERSION,
  items: [],
  wings: [],
  discoveries: [],
  blocks: [],
  unlockedChapters: [],
  visits: [],
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function itemId(item: ItemInput): string {
  if (typeof item === "string") return slug(item)
  return text(item.id) || slug(item.name)
}

export function normalizeQuantity(value: unknown): number {
  const quantity = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(quantity)) return 1
  return Math.max(1, Math.min(999, Math.round(quantity)))
}

export function normalizeItem(item: ItemInput, now = Date.now()): GameItem | null {
  const input = typeof item === "string" ? { name: item } : item
  const name = text(input.name)
  if (!name) return null

  return {
    id: itemId(item),
    name,
    source: text(input.source),
    quantity: normalizeQuantity(input.quantity),
    acquiredAt: now,
  }
}

export function wingId(wing: WingInput): string {
  if (typeof wing === "string") return slug(wing)
  return text(wing.id) || slug(wing.name)
}

export function normalizeWing(wing: WingInput, now = Date.now()): GameWing | null {
  const input = typeof wing === "string" ? { name: wing } : wing
  const name = text(input.name)
  if (!name) return null

  return {
    id: wingId(wing),
    name,
    source: text(input.source),
    collectedAt: now,
  }
}

function sameItem(left: GameItem, right: ItemInput): boolean {
  if (typeof right === "string") return slug(left.name) === slug(right)
  if (text(right.id)) return left.id === text(right.id)
  return slug(left.name) === slug(right.name)
}

function sameWing(left: GameWing, right: WingInput): boolean {
  if (typeof right === "string") return slug(left.name) === slug(right)
  if (text(right.id)) return left.id === text(right.id)
  return slug(left.name) === slug(right.name)
}

export function isGameState(value: unknown): value is GameState {
  if (typeof value !== "object" || value === null) return false
  const state = value as Partial<GameState>
  if (state.version !== GAME_STATE_VERSION) return false
  if (
    !Array.isArray(state.items) ||
    !Array.isArray(state.wings ?? []) ||
    !Array.isArray(state.discoveries ?? []) ||
    !Array.isArray(state.unlockedChapters) ||
    !Array.isArray(state.visits ?? [])
  ) {
    return false
  }

  const visits = state.visits ?? []
  if (
    !visits.every(
      (visit) =>
        typeof visit === "object" &&
        visit !== null &&
        typeof (visit as GameVisit).location === "string" &&
        Array.isArray((visit as GameVisit).pages) &&
        (visit as GameVisit).pages.every((page) => typeof page === "string" && page.length > 0) &&
        Number.isInteger((visit as GameVisit).count) &&
        // `count` is derived from `pages`, so a mismatch means the row was
        // hand-edited or written by an older build. Rejecting it keeps the
        // invariant that the two can never drift apart.
        (visit as GameVisit).count === (visit as GameVisit).pages.length &&
        Number.isInteger((visit as GameVisit).lastVisitedAt),
    )
  ) {
    return false
  }

  const blocks = state.blocks ?? []
  if (
    !Array.isArray(blocks) ||
    !blocks.every(
      (block) =>
        typeof block === "object" &&
        block !== null &&
        typeof block.id === "string" &&
        block.id.length > 0 &&
        typeof block.content === "string",
    )
  ) {
    return false
  }

  return (
    state.items.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        item.id.length > 0 &&
        typeof item.name === "string" &&
        item.name.length > 0 &&
        typeof item.source === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        Number.isInteger(item.acquiredAt),
    ) &&
    (state.wings ?? []).every(
      (wing) =>
        typeof wing === "object" &&
        wing !== null &&
        typeof wing.id === "string" &&
        wing.id.length > 0 &&
        typeof wing.name === "string" &&
        wing.name.length > 0 &&
        typeof wing.source === "string" &&
        Number.isInteger(wing.collectedAt),
    ) &&
    (state.discoveries ?? []).every(
      (discovery) => typeof discovery === "string" && discovery.length > 0,
    ) &&
    state.unlockedChapters.every((chapter) => typeof chapter === "string" && chapter.length > 0)
  )
}

export function cloneState(state: GameState): GameState {
  return {
    version: GAME_STATE_VERSION,
    items: state.items.map((item) => ({ ...item })),
    wings: (state.wings ?? []).map((wing) => ({ ...wing })),
    discoveries: [...(state.discoveries ?? [])],
    blocks: (state.blocks ?? []).map((block) => ({ id: block.id, content: block.content })),
    unlockedChapters: [...state.unlockedChapters],
    visits: (state.visits ?? []).map((visit) => ({
      location: visit.location,
      pages: [...visit.pages],
      count: visit.count,
      lastVisitedAt: visit.lastVisitedAt,
    })),
  }
}

export function validateCommand(command: unknown): asserts command is GameCommand {
  if (
    typeof command !== "object" ||
    command === null ||
    typeof (command as { type?: unknown }).type !== "string"
  ) {
    throw new Error("Invalid game command")
  }

  const candidate = command as Record<string, unknown>
  if (candidate.type === "chapter_unlocked") {
    if (!text(candidate.chapter)) throw new Error("A chapter name is required")
    return
  }

  if (candidate.type === "discovery_unlocked") {
    if (!text(candidate.discovery)) throw new Error("A discovery identifier is required")
    return
  }

  if (candidate.type === "items_synchronized") {
    if (!Array.isArray(candidate.items)) throw new Error("Synchronized items must be an array")
    for (const item of candidate.items) {
      if (
        (typeof item !== "string" || !text(item)) &&
        (typeof item !== "object" ||
          item === null ||
          typeof (item as { name?: unknown }).name !== "string" ||
          !text((item as { name: string }).name))
      ) {
        throw new Error("A synchronized item name is required")
      }
    }
    return
  }

  if (candidate.type === "wing_collected") {
    const wing = candidate.wing
    if (typeof wing === "string" && text(wing)) return
    if (
      typeof wing === "object" &&
      wing !== null &&
      typeof (wing as { name?: unknown }).name === "string" &&
      text((wing as { name: string }).name)
    ) {
      return
    }
    throw new Error("A wing name is required")
  }

  if (candidate.type === "blocks_synchronized") {
    if (!Array.isArray(candidate.blocks)) throw new Error("Synchronized blocks must be an array")
    for (const block of candidate.blocks) {
      if (
        typeof block !== "object" ||
        block === null ||
        typeof (block as { id?: unknown }).id !== "string" ||
        !text((block as { id: string }).id) ||
        typeof (block as { content?: unknown }).content !== "string"
      ) {
        throw new Error("A synchronized block must have an id and content")
      }
    }
    return
  }

  if (candidate.type === "block_updated") {
    const block = candidate.block
    if (
      typeof block !== "object" ||
      block === null ||
      typeof (block as { id?: unknown }).id !== "string" ||
      !text((block as { id: string }).id) ||
      typeof (block as { content?: unknown }).content !== "string"
    ) {
      throw new Error("A valid fenced block is required")
    }
    return
  }

  if (candidate.type === "location_visited") {
    if (
      typeof (candidate as { location?: unknown }).location !== "string" ||
      !text((candidate as { location: string }).location) ||
      typeof (candidate as { page?: unknown }).page !== "string" ||
      !text((candidate as { page: string }).page)
    ) {
      throw new Error("A valid location and page are required")
    }
    return
  }

  if (candidate.type !== "item_placed" && candidate.type !== "item_taken") {
    throw new Error(`Unknown game command: ${String(candidate.type)}`)
  }

  const item = candidate.item
  if (typeof item === "string" && text(item)) return
  if (
    typeof item === "object" &&
    item !== null &&
    typeof (item as { name?: unknown }).name === "string" &&
    text((item as { name: string }).name)
  ) {
    return
  }

  throw new Error("An item name is required")
}

export function applyCommand(state: GameState, command: GameCommand, now = Date.now()): GameState {
  validateCommand(command)
  const next = cloneState(state)

  if (command.type === "location_visited") {
    const location = text(command.location)
    const page = text(command.page)
    if (!location || !page) return next

    const index = next.visits.findIndex((visit) => visit.location === location)
    if (index === -1) {
      next.visits.push({ location, pages: [page], count: 1, lastVisitedAt: now })
      return next
    }

    const existing = next.visits[index]
    // Discovery is per distinct page: revisiting one refreshes the timestamp but
    // must not raise the count. `count` is kept equal to pages.length so the two
    // can never drift apart.
    const pages = existing.pages.includes(page) ? [...existing.pages] : [...existing.pages, page]
    next.visits[index] = {
      location,
      pages,
      count: pages.length,
      lastVisitedAt: now,
    }
    return next
  }

  if (command.type === "chapter_unlocked") {
    const chapter = text(command.chapter)
    if (!next.unlockedChapters.includes(chapter)) next.unlockedChapters.push(chapter)
    return next
  }

  if (command.type === "discovery_unlocked") {
    const discovery = text(command.discovery)
    if (!next.discoveries.includes(discovery)) next.discoveries.push(discovery)
    return next
  }

  if (command.type === "items_synchronized") {
    for (const input of command.items) {
      const item = normalizeItem(input, now)
      if (!item) continue
      const existingIndex = next.items.findIndex((entry) => sameItem(entry, input))
      if (existingIndex === -1) {
        next.items.push(item)
      } else if (next.items[existingIndex].quantity < item.quantity) {
        next.items[existingIndex] = { ...next.items[existingIndex], quantity: item.quantity }
      }
    }
    return next
  }

  if (command.type === "wing_collected") {
    const wing = normalizeWing(command.wing, now)
    if (!wing) return next
    if (!next.wings.some((entry) => sameWing(entry, command.wing))) next.wings.push(wing)
    return next
  }

  if (command.type === "blocks_synchronized") {
    for (const input of command.blocks) {
      if (next.blocks.some((block) => block.id === input.id)) continue
      next.blocks.push({ id: input.id, content: input.content })
    }
    return next
  }

  if (command.type === "block_updated") {
    const index = next.blocks.findIndex((block) => block.id === command.block.id)
    if (index === -1) next.blocks.push({ id: command.block.id, content: command.block.content })
    else next.blocks[index] = { id: command.block.id, content: command.block.content }
    return next
  }

  const item = normalizeItem(command.item, now)
  if (!item) return next

  const existingIndex = next.items.findIndex((entry) => sameItem(entry, command.item))
  if (command.type === "item_taken") {
    if (existingIndex === -1) {
      next.items.push(item)
    } else {
      const existing = next.items[existingIndex]
      next.items[existingIndex] = {
        ...existing,
        quantity: normalizeQuantity(existing.quantity + item.quantity),
      }
    }
    return next
  }

  if (existingIndex === -1) return next
  const existing = next.items[existingIndex]
  const remaining = existing.quantity - item.quantity
  if (remaining > 0) {
    next.items[existingIndex] = { ...existing, quantity: remaining }
  } else {
    next.items.splice(existingIndex, 1)
  }
  return next
}
