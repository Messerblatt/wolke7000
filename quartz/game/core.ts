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

export type GameState = {
  version: typeof GAME_STATE_VERSION
  items: GameItem[]
  blocks: GameBlock[]
  unlockedChapters: string[]
}

export type GameBlock = {
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

export type GameCommand =
  | { type: "item_placed"; item: ItemInput }
  | { type: "item_taken"; item: ItemInput }
  | { type: "items_synchronized"; items: ItemInput[] }
  | { type: "block_updated"; block: GameBlock }
  | { type: "chapter_unlocked"; chapter: string }

export const EMPTY_GAME_STATE: GameState = {
  version: GAME_STATE_VERSION,
  items: [],
  blocks: [],
  unlockedChapters: [],
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

function sameItem(left: GameItem, right: ItemInput): boolean {
  if (typeof right === "string") return slug(left.name) === slug(right)
  if (text(right.id)) return left.id === text(right.id)
  return slug(left.name) === slug(right.name)
}

export function isGameState(value: unknown): value is GameState {
  if (typeof value !== "object" || value === null) return false
  const state = value as Partial<GameState>
  if (state.version !== GAME_STATE_VERSION) return false
  if (!Array.isArray(state.items) || !Array.isArray(state.unlockedChapters)) return false

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
    state.unlockedChapters.every((chapter) => typeof chapter === "string" && chapter.length > 0)
  )
}

export function cloneState(state: GameState): GameState {
  return {
    version: GAME_STATE_VERSION,
    items: state.items.map((item) => ({ ...item })),
    blocks: (state.blocks ?? []).map((block) => ({ ...block })),
    unlockedChapters: [...state.unlockedChapters],
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

  if (command.type === "chapter_unlocked") {
    const chapter = text(command.chapter)
    if (!next.unlockedChapters.includes(chapter)) next.unlockedChapters.push(chapter)
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

  if (command.type === "block_updated") {
    const index = next.blocks.findIndex((block) => block.id === command.block.id)
    if (index === -1) next.blocks.push({ ...command.block })
    else next.blocks[index] = { ...command.block }
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
