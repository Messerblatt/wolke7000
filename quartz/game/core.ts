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

export type MaterialIndexEntry = {
  componentId: string
  quantity: number
  shipId: string
  locationId: string
  updatedAt: number
  revision: number
}

export type OpenWingsMessage = {
  messageId: string
  sender: string
  destination: string
  revision: number
  payload: MaterialIndexEntry[]
}

export type Pigeon = {
  id: string
  homeLoft: string
  currentLocation: string
  status: string
}

export type OpenWingsShip = {
  id: string
  locationId: string
}

export type VolierClaims = {
  date: string
  count: number
}

export const VOLIER_DAILY_LIMIT = 20

export const OPEN_WINGS_SHIPS: OpenWingsShip[] = [
  { id: "everything-markthalle-9", locationId: "markthalle-9" },
  { id: "everything-brandenburger-tor", locationId: "brandenburger-tor" },
  { id: "everything-gasometer", locationId: "gasometer" },
]

export type GameState = {
  version: typeof GAME_STATE_VERSION
  items: GameItem[]
  wings: GameWing[]
  discoveries: string[]
  blocks: GameBlock[]
  unlockedChapters: string[]
  visits: GameVisit[]
  /** Number of distinct visited pages for each clan. */
  clans: Record<string, number>
  /** Experience points earned by the player. */
  exp: number
  materialIndex: MaterialIndexEntry[]
  processedOpenWingsMessages: string[]
  pigeons: Pigeon[]
  openWingsShips: OpenWingsShip[]
  openWingsMessages: OpenWingsMessage[]
  volierClaims: VolierClaims
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
  | { type: "exp_gained" }
  | { type: "open_wings_message_received"; message: OpenWingsMessage }
  | { type: "pigeon_updated"; pigeon: Pigeon }
  | { type: "pigeons_claimed"; pigeonIds: string[]; date: string }
  | { type: "item_placed"; item: ItemInput }
  | { type: "item_taken"; item: ItemInput }
  | { type: "items_synchronized"; items: ItemInput[] }
  | { type: "wing_collected"; wing: WingInput }
  | { type: "discovery_unlocked"; discovery: string }
  | { type: "blocks_synchronized"; blocks: GameBlockInput[] }
  | { type: "block_updated"; block: GameBlockInput }
  | { type: "chapter_unlocked"; chapter: string }
  | { type: "location_visited"; location: string; page: string; clan?: string }

export const EMPTY_GAME_STATE: GameState = {
  version: GAME_STATE_VERSION,
  items: [],
  wings: [],
  discoveries: [],
  blocks: [],
  unlockedChapters: [],
  visits: [],
  clans: {},
  exp: 0,
  materialIndex: [],
  processedOpenWingsMessages: [],
  pigeons: [],
  openWingsShips: OPEN_WINGS_SHIPS.map((ship) => ({ ...ship })),
  openWingsMessages: [],
  volierClaims: { date: "", count: 0 },
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

function materialIndexKey(entry: MaterialIndexEntry): string {
  return `${entry.shipId}::${entry.componentId}`
}

function validMaterialIndexEntry(value: unknown): value is MaterialIndexEntry {
  if (typeof value !== "object" || value === null) return false
  const entry = value as MaterialIndexEntry
  return (
    text(entry.componentId).length > 0 &&
    Number.isInteger(entry.quantity) &&
    entry.quantity >= 0 &&
    text(entry.shipId).length > 0 &&
    text(entry.locationId).length > 0 &&
    Number.isInteger(entry.updatedAt) &&
    entry.updatedAt >= 0 &&
    Number.isInteger(entry.revision) &&
    entry.revision >= 0
  )
}

function validPigeon(value: unknown): value is Pigeon {
  if (typeof value !== "object" || value === null) return false
  const pigeon = value as Pigeon
  return (
    text(pigeon.id).length > 0 &&
    text(pigeon.homeLoft).length > 0 &&
    text(pigeon.currentLocation).length > 0 &&
    text(pigeon.status).length > 0
  )
}

function validOpenWingsMessage(value: unknown): value is OpenWingsMessage {
  if (typeof value !== "object" || value === null) return false
  const message = value as OpenWingsMessage
  return (
    text(message.messageId).length > 0 &&
    text(message.sender).length > 0 &&
    text(message.destination).length > 0 &&
    Number.isInteger(message.revision) &&
    message.revision >= 0 &&
    Array.isArray(message.payload) &&
    message.payload.every(validMaterialIndexEntry)
  )
}

function validVolierClaims(value: unknown): value is VolierClaims {
  if (typeof value !== "object" || value === null) return false
  const claims = value as VolierClaims
  return (
    typeof claims.date === "string" &&
    Number.isInteger(claims.count) &&
    claims.count >= 0 &&
    claims.count <= VOLIER_DAILY_LIMIT
  )
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

  if (
    state.clans !== undefined &&
    (typeof state.clans !== "object" ||
      state.clans === null ||
      Array.isArray(state.clans) ||
      !Object.entries(state.clans).every(
        ([clan, count]) => clan.length > 0 && Number.isInteger(count) && count >= 0,
      ))
  ) {
    return false
  }

  if (state.exp !== undefined && (!Number.isInteger(state.exp) || state.exp < 0)) return false

  const materialIndex = state.materialIndex ?? []
  const pigeons = state.pigeons ?? []
  const openWingsShips = state.openWingsShips ?? OPEN_WINGS_SHIPS
  const openWingsMessages = state.openWingsMessages ?? []
  if (
    !Array.isArray(materialIndex) ||
    !materialIndex.every(validMaterialIndexEntry) ||
    !Array.isArray(state.processedOpenWingsMessages ?? []) ||
    !(state.processedOpenWingsMessages ?? []).every((messageId) => text(messageId).length > 0) ||
    !Array.isArray(pigeons) ||
    !pigeons.every(validPigeon) ||
    !Array.isArray(openWingsShips) ||
    !openWingsShips.every(
      (ship) =>
        typeof ship === "object" &&
        ship !== null &&
        text(ship.id).length > 0 &&
        text(ship.locationId).length > 0,
    ) ||
    !Array.isArray(openWingsMessages) ||
    !openWingsMessages.every(validOpenWingsMessage) ||
    !validVolierClaims(state.volierClaims ?? { date: "", count: 0 })
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
    clans: { ...(state.clans ?? {}) },
    exp: state.exp ?? 0,
    materialIndex: (state.materialIndex ?? []).map((entry) => ({ ...entry })),
    processedOpenWingsMessages: [...(state.processedOpenWingsMessages ?? [])],
    pigeons: (state.pigeons ?? []).map((pigeon) => ({ ...pigeon })),
    openWingsShips: (state.openWingsShips ?? OPEN_WINGS_SHIPS).map((ship) => ({ ...ship })),
    openWingsMessages: (state.openWingsMessages ?? []).map((message) => ({
      ...message,
      payload: message.payload.map((entry) => ({ ...entry })),
    })),
    volierClaims: { ...(state.volierClaims ?? { date: "", count: 0 }) },
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

  if (candidate.type === "exp_gained") return

  if (candidate.type === "open_wings_message_received") {
    const message = candidate.message as Partial<OpenWingsMessage> | null
    if (validOpenWingsMessage(message)) {
      return
    }
    throw new Error("A valid Open Wings message is required")
  }

  if (candidate.type === "pigeon_updated") {
    if (validPigeon(candidate.pigeon)) return
    throw new Error("A valid pigeon is required")
  }

  if (candidate.type === "pigeons_claimed") {
    const pigeonIds = candidate.pigeonIds
    if (
      Array.isArray(pigeonIds) &&
      pigeonIds.length > 0 &&
      pigeonIds.every((id) => typeof id === "string" && text(id)) &&
      typeof candidate.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(candidate.date)
    ) {
      return
    }
    throw new Error("A valid pigeon claim is required")
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
    if (candidate.clan !== undefined && typeof candidate.clan !== "string") {
      throw new Error("A clan must be a string")
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

  if (command.type === "exp_gained") {
    next.exp += 1
    return next
  }

  if (command.type === "open_wings_message_received") {
    const message = command.message
    if (next.processedOpenWingsMessages.includes(message.messageId)) return next

    next.processedOpenWingsMessages.push(message.messageId)
    next.openWingsMessages.push({
      ...message,
      payload: message.payload.map((entry) => ({ ...entry })),
    })
    for (const entry of message.payload) {
      const incomingEntry = {
        ...entry,
        revision: Math.max(entry.revision, message.revision),
      }
      const existingIndex = next.materialIndex.findIndex(
        (current) => materialIndexKey(current) === materialIndexKey(incomingEntry),
      )
      if (existingIndex === -1) {
        next.materialIndex.push(incomingEntry)
      } else if (incomingEntry.revision > next.materialIndex[existingIndex].revision) {
        next.materialIndex[existingIndex] = incomingEntry
      }
    }
    return next
  }

  if (command.type === "pigeon_updated") {
    const existingIndex = next.pigeons.findIndex((pigeon) => pigeon.id === command.pigeon.id)
    if (existingIndex === -1) next.pigeons.push({ ...command.pigeon })
    else next.pigeons[existingIndex] = { ...command.pigeon }
    return next
  }

  if (command.type === "pigeons_claimed") {
    const currentClaims = next.volierClaims.date === command.date ? next.volierClaims.count : 0
    const remaining = VOLIER_DAILY_LIMIT - currentClaims
    if (remaining <= 0) return next

    const available = command.pigeonIds
      .map((id) => next.pigeons.find((pigeon) => pigeon.id === id))
      .filter(
        (pigeon): pigeon is Pigeon =>
          pigeon !== undefined &&
          pigeon.status === "available" &&
          pigeon.currentLocation === "volier",
      )
      .slice(0, remaining)
    for (const pigeon of available) {
      const index = next.pigeons.findIndex((current) => current.id === pigeon.id)
      next.pigeons[index] = { ...pigeon, currentLocation: "player", status: "carried" }
    }
    next.volierClaims = { date: command.date, count: currentClaims + available.length }
    return next
  }

  if (command.type === "location_visited") {
    const location = text(command.location)
    const page = text(command.page)
    const clan = text(command.clan)
    if (!location || !page) return next

    // A page can be rendered more than once during SPA navigation. Clan
    // counts follow the same distinct-page semantics as location counts.
    const pageAlreadyVisited = next.visits.some((visit) => visit.pages.includes(page))
    if (clan && !pageAlreadyVisited) {
      const currentCount = Object.prototype.hasOwnProperty.call(next.clans, clan)
        ? next.clans[clan]
        : 0
      next.clans[clan] = currentCount + 1
    }

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
