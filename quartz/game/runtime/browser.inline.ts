import { getWolke } from "./browser"

const game = getWolke()

type OpenWingsSeedWindow = Window & {
  __wolkeOpenWingsSeed?: {
    id: string
    homeLoft: string
    currentLocation: string
    status: string
  }[]
}

function seedOpenWingsPigeons() {
  const seed = (window as OpenWingsSeedWindow).__wolkeOpenWingsSeed ?? []
  const known = new Set(game.pigeons.map((pigeon) => pigeon.id))
  for (const pigeon of seed) {
    if (known.has(pigeon.id)) continue
    known.add(pigeon.id)
    void game.execute({ type: "pigeon_updated", pigeon })
  }
}

function itemFromDetail(
  detail: unknown,
): { name: string; source: string; id?: string; quantity?: number } | null {
  if (typeof detail !== "object" || detail === null) return null
  const value = detail as Record<string, unknown>
  const item = value.item

  if (typeof item === "string" && item.trim()) {
    return {
      name: item.trim(),
      source: typeof value.source === "string" ? value.source : window.location.pathname,
      quantity: typeof value.quantity === "number" ? value.quantity : undefined,
    }
  }

  if (
    typeof item === "object" &&
    item !== null &&
    typeof (item as { name?: unknown }).name === "string"
  ) {
    const object = item as Record<string, unknown>
    return {
      name: object.name as string,
      source: typeof object.source === "string" ? object.source : window.location.pathname,
      id: typeof object.id === "string" ? object.id : undefined,
      quantity: typeof object.quantity === "number" ? object.quantity : undefined,
    }
  }

  if (typeof value.name === "string" && value.name.trim()) {
    return { name: value.name.trim(), source: window.location.pathname }
  }

  return null
}

function letterValue(value: string): string {
  const trimmed = value.trim()
  const match = trimmed.match(/^\[\[(.+)\]\]$/)
  return match?.[1]?.trim() ?? trimmed
}

function letterFromBlock(block: Element): import("./core").LetterInput | null {
  const lines = blockContent(block)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const id = lines.shift()
  if (!id) return null

  const fields: Record<string, string> = {}
  let contentLines: string[] = []
  let readingContent = false
  for (const line of lines) {
    const field = line.match(/^(from|recipient|destination|content):\s*(.*)$/i)
    if (field) {
      readingContent = field[1].toLowerCase() === "content"
      if (readingContent) contentLines = [field[2]]
      else fields[field[1].toLowerCase()] = letterValue(field[2])
    } else if (readingContent) {
      contentLines.push(line)
    }
  }

  if (!fields.from || !fields.recipient || !fields.destination || !contentLines.join("\n").trim()) {
    return null
  }
  return {
    id,
    name: id,
    sender: fields.from,
    recipient: fields.recipient,
    destination: fields.destination,
    content: contentLines.join("\n").trim(),
  }
}

function handleItemEvent(event: Event) {
  const detail = (event as CustomEvent).detail
  const item = itemFromDetail(detail)
  if (!item) return

  const value =
    typeof detail === "object" && detail !== null ? (detail as Record<string, unknown>) : null
  const blockId = typeof value?.blockId === "string" ? value.blockId : ""
  const after = typeof value?.after === "string" ? value.after : ""
  const updateBlock = blockId
    ? game.execute({
        type: "block_updated",
        block: { id: blockId, content: after },
      })
    : Promise.resolve()

  void updateBlock.then(() =>
    game.execute({ type: event.type as "item_placed" | "item_taken", item }),
  )
}

function emitItemEvent(type: "item_placed" | "item_taken", item: Record<string, unknown>) {
  const detail = { ...item, type }
  document.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }))
  const setting = document.querySelector("[data-event-logging]")?.getAttribute("data-event-logging")
  if (setting === null || setting === undefined || setting === "true") {
    console.log("[wolke game] emitted", detail)
  }
}

function stashLetterBlock(block: Element): boolean {
  if (!isLetterBlock(block)) return false
  const letter = letterFromBlock(block)
  if (!letter) return true

  const blockId = blockIdFor(block)
  const alreadyCollected = game.getSnapshot().letters.some((entry) => entry.id === letter.id)
  trackedBlocks.set(block, "")
  ;(block.closest("figure") ?? block).remove()
  if (alreadyCollected) {
    void game.execute({ type: "block_updated", block: { id: blockId, content: "" } })
    return true
  }

  void (async () => {
    await game.execute({ type: "block_updated", block: { id: blockId, content: "" } })
    await game.execute({ type: "letter_received", letter })
  })().catch((error) => console.error("[wolke game] could not stash letter", error))
  return true
}

function collectWingsBlock(block: Element): boolean {
  if (!isWingsBlock(block)) return false

  const name = blockContent(block)
  if (!name) return true

  const blockId = blockIdFor(block)
  const wing = {
    id: blockId,
    name,
    source: window.location.pathname,
  }
  const snapshot = game.getSnapshot()
  const alreadyCollected =
    snapshot.blocks.some((saved) => saved.id === blockId && saved.content === "") ||
    snapshot.wings.some((saved) => saved.id === blockId)

  trackedBlocks.set(block, "")
  ;(block.closest("figure") ?? block).remove()
  if (alreadyCollected) {
    void game.execute({ type: "block_updated", block: { id: blockId, content: "" } })
    return true
  }

  void (async () => {
    await game.execute({ type: "block_updated", block: { id: blockId, content: "" } })
    await game.execute({ type: "wing_collected", wing })
  })().catch((error) => console.error("[wolke game] could not collect wings", error))
  return true
}

const syncedRucksackEntries = new Set<string>()
const trackedBlocks = new Map<Element, string>()
const silentRucksackRemovals = new Set<string>()
const consumedRucksackSources = new Set<string>()

function blockContent(block: Element): string {
  const code = block.querySelector("code")
  const lines = code?.querySelectorAll("[data-line]")
  if (lines && lines.length > 0) {
    return Array.from(lines)
      .map((line) => line.textContent ?? "")
      .join("\n")
      .trim()
  }
  return (code?.textContent ?? block.textContent ?? "").trim()
}

function blockLanguage(block: Element): string {
  const language =
    block.getAttribute("data-language") ??
    block.querySelector("[data-language]")?.getAttribute("data-language")
  if (language) return language

  const languageClass = Array.from(block.querySelector("code")?.classList ?? []).find((name) =>
    name.startsWith("language-"),
  )
  return languageClass?.slice("language-".length) ?? ""
}

function fenceLanguage(block: Element): string {
  return blockLanguage(block).toLowerCase()
}

function isLetterBlock(block: Element): boolean {
  return fenceLanguage(block) === "letter"
}

function isWingsBlock(block: Element): boolean {
  return fenceLanguage(block) === "wings"
}

function isCollectibleBlock(block: Element): boolean {
  return isLetterBlock(block) || isWingsBlock(block)
}

function blockIdFor(block: Element): string {
  const existing = block.getAttribute("data-wolke-block-id")
  if (existing) return existing
  const blocks = Array.from(document.querySelectorAll<Element>("pre"))
  const index = Math.max(0, blocks.indexOf(block))
  const id = `${currentPage()}#block-${index}`
  block.setAttribute("data-wolke-block-id", id)
  return id
}

function primeBlocks() {
  trackedBlocks.clear()
  const pageBlocks = Array.from(document.querySelectorAll<Element>("pre"))
  pageBlocks.forEach((block) => block.removeAttribute("data-wolke-block-id"))
  const blocks: { id: string; content: string }[] = []
  for (const block of pageBlocks) {
    const id = blockIdFor(block)
    const content = blockContent(block)
    blocks.push({ id, content })
    trackedBlocks.set(block, content)
  }
  void game.execute({ type: "blocks_synchronized", blocks })
}

function inspectChangedBlocks(mutations: MutationRecord[]) {
  const blocks = new Set<Element>()
  for (const mutation of mutations) {
    const target: Element | null =
      mutation.target.nodeType === Node.ELEMENT_NODE
        ? (mutation.target as Element)
        : mutation.target.parentElement
    const block = target?.closest("pre")
    if (block) blocks.add(block)
    if (mutation.type === "childList") {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue
        if (node.matches("pre")) blocks.add(node)
        node.querySelectorAll("pre").forEach((child) => blocks.add(child))
      }
    }
  }

  for (const block of blocks) {
    if (!document.contains(block)) continue
    const current = blockContent(block)
    const previous = trackedBlocks.get(block)
    if (previous === undefined) {
      trackedBlocks.set(block, current)
      continue
    }
    if (current === previous) continue

    trackedBlocks.set(block, current)
  }
}

function currentPage(): string {
  const path = decodeURIComponent(window.location.pathname).replace(/^\/+/, "")
  return path === "" || path === "index" || path === "index/" ? "index" : path
}

/** Keep the Rucksack from putting a consumed source fence back into the page. */
function removeConsumedRucksackSources() {
  const page = currentPage()
  for (const slug of consumedRucksackSources) {
    const separator = slug.lastIndexOf("#")
    if (separator < 1 || slug.slice(0, separator) !== page) continue
    const anchor = slug.slice(separator + 1)
    const block = Array.from(document.querySelectorAll("[data-rucksack-block]")).find(
      (element) => element.getAttribute("data-rucksack-block") === anchor,
    )
    if (!block) continue
    ;(block.closest("figure") ?? block).remove()
    consumedRucksackSources.delete(slug)
  }
}

function syncRucksackEntries() {
  for (const entry of document.querySelectorAll("[data-rucksack-slug]")) {
    const id = entry.getAttribute("data-rucksack-slug")
    const name = entry.querySelector(".rucksack-name")?.textContent?.trim()
    if (!id || !name) continue

    entry.setAttribute("draggable", "true")
    if (syncedRucksackEntries.has(id)) continue

    const quantityText = entry.querySelector(".rucksack-quantity")?.textContent ?? ""
    const quantity = Number.parseInt(quantityText.replace(/[^0-9]/g, ""), 10)
    syncedRucksackEntries.add(id)
    void game.execute({
      type: "items_synchronized",
      items: [
        {
          id,
          name,
          source: window.location.pathname,
          quantity: Number.isFinite(quantity) ? quantity : 1,
        },
      ],
    })
  }
}

function itemFromDragSource(source: Element): Record<string, unknown> | null {
  const rucksackEntry = source.closest("[data-rucksack-slug]")
  if (rucksackEntry) {
    const id = rucksackEntry.getAttribute("data-rucksack-slug")
    const nameElement = rucksackEntry.querySelector(".rucksack-name")
    const name = nameElement?.getAttribute("title")?.trim() || nameElement?.textContent?.trim()
    if (id && name) return { id, name, source: window.location.pathname, quantity: 1 }
  }

  const inventoryEntry = source.closest("[data-game-item-id]")
  if (inventoryEntry) {
    const id = inventoryEntry.getAttribute("data-game-item-id")
    const name = inventoryEntry.getAttribute("data-game-item-name")
    if (id && name) return { id, name, source: window.location.pathname, quantity: 1 }
  }

  return null
}

function onDragStart(event: DragEvent) {
  const target = event.target
  if (!(target instanceof Element) || !event.dataTransfer) return
  const item = itemFromDragSource(target)
  if (!item) return

  event.dataTransfer.effectAllowed = "move"
  event.dataTransfer.setData("application/x-wolke-item", JSON.stringify(item))
  event.dataTransfer.setData("text/plain", String(item.name))
}

function dropTarget(target: EventTarget | null): Element | null {
  return target instanceof Element ? target.closest("pre") : null
}

function onDragOver(event: DragEvent) {
  const block = dropTarget(event.target)
  if (!block || !event.dataTransfer?.types.includes("application/x-wolke-item")) return
  event.preventDefault()
  event.dataTransfer.dropEffect = "move"
  block.classList.add("wolke-drop-target")
}

function onDragLeave(event: DragEvent) {
  dropTarget(event.target)?.classList.remove("wolke-drop-target")
}

function onDragEnd() {
  document.querySelectorAll("pre.wolke-drop-target").forEach((block) => {
    block.classList.remove("wolke-drop-target")
  })
}

function writeBlockContent(block: Element, content: string) {
  let code = block.querySelector("code")
  if (!code) {
    code = document.createElement("code")
    block.append(code)
  }

  if (!content) {
    code.replaceChildren()
    return
  }

  code.replaceChildren(
    ...content.split("\n").map((line) => {
      const lineElement = document.createElement("span")
      lineElement.setAttribute("data-line", "")
      lineElement.textContent = line
      return lineElement
    }),
  )
}

function restoreSavedBlocks(snapshot: import("./core").GameState) {
  let changed = false
  const pageBlocks = Array.from(document.querySelectorAll<Element>("pre"))
  pageBlocks.forEach((block) => blockIdFor(block))
  for (const block of pageBlocks) {
    const saved = snapshot.blocks.find((candidate) => candidate.id === blockIdFor(block))
    if (saved && !saved.content && isCollectibleBlock(block)) {
      trackedBlocks.set(block, "")
      ;(block.closest("figure") ?? block).remove()
      changed = true
      continue
    }
    if (!saved || blockContent(block) === saved.content) continue
    writeBlockContent(block, saved.content)
    trackedBlocks.set(block, saved.content)
    changed = true
  }

  if (changed) {
    window.setTimeout(() => window.dispatchEvent(new Event("nav")), 0)
  }
}

function removeDraggedRucksackEntry(item: Record<string, unknown>) {
  const id = typeof item.id === "string" ? item.id : ""
  if (!id) return
  const remove = document.querySelector<HTMLElement>(
    `[data-rucksack-remove-entry="${CSS.escape(id)}"]`,
  )
  if (!remove) return

  silentRucksackRemovals.add(id)
  consumedRucksackSources.add(id)
  syncedRucksackEntries.delete(id)
  remove.click()
  window.setTimeout(() => silentRucksackRemovals.delete(id), 0)
}

function onDrop(event: DragEvent) {
  const block = dropTarget(event.target)
  const raw = event.dataTransfer?.getData("application/x-wolke-item")
  if (!block || !raw) return
  event.preventDefault()
  block.classList.remove("wolke-drop-target")

  try {
    const item = JSON.parse(raw) as Record<string, unknown>
    const name = typeof item.name === "string" ? item.name.trim() : ""
    if (!name) return

    const before = blockContent(block)
    const after = before ? `${before}\n${name}` : name
    const blockId = blockIdFor(block)

    // Update the tracked value before mutating the DOM. The mutation observer
    // will therefore not emit a second placement event for this drop.
    trackedBlocks.set(block, after)
    writeBlockContent(block, after)
    emitItemEvent("item_placed", {
      item,
      blockId,
      before,
      after,
      language: blockLanguage(block),
    })
    removeDraggedRucksackEntry(item)
  } catch {
    // Ignore malformed drag payloads from other pages or extensions.
  }
}

function renderLegacyInventory(snapshot: import("./core").GameState) {
  const root = document.querySelector("[data-inventory]")
  const list = root?.querySelector("[data-inventory-items]")
  const count = root?.querySelector("[data-inventory-count]")
  const empty = root?.querySelector("[data-inventory-empty]")
  if (!root || !list || !count) return

  count.textContent = String(snapshot.items.length)
  list.replaceChildren()
  if (empty) empty.toggleAttribute("hidden", snapshot.items.length > 0)

  for (const item of snapshot.items) {
    const row = document.createElement("li")
    row.className = "inventory-item"
    row.dataset.gameItemId = item.id
    row.dataset.gameItemName = item.name
    row.draggable = true

    const name = document.createElement("span")
    name.className = "inventory-item-name"
    name.textContent = item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name

    const remove = document.createElement("button")
    remove.type = "button"
    remove.className = "inventory-remove"
    remove.dataset.gameRemoveItem = item.id
    remove.textContent = "×"
    remove.title = "Aus Inventar entfernen"

    row.append(name, remove)
    list.append(row)
  }
}

let renderingRucksack = false

function rucksackLists(): Element[] {
  return Array.from(
    document.querySelectorAll("[data-rucksack-entries], [data-rucksack-modal-entries]"),
  )
}

function rucksackNeedsRuntimeRender(snapshot: import("./core").GameState): boolean {
  for (const list of rucksackLists()) {
    const rows = Array.from(list.children)
    if (rows.length !== snapshot.items.length) return true
    if (rows.some((row) => !row.hasAttribute("data-game-item-id"))) return true
  }
  return false
}

function renderRucksack(snapshot: import("./core").GameState) {
  if (renderingRucksack) return
  const lists = rucksackLists()
  if (lists.length === 0) return

  // Let the installed Rucksack hydrate once before taking over its rows. This
  // imports old IndexedDB entries silently through syncRucksackEntries().
  if (snapshot.items.length === 0 && document.querySelector("[data-rucksack-slug]")) return
  if (!rucksackNeedsRuntimeRender(snapshot)) return

  renderingRucksack = true
  try {
    for (const count of document.querySelectorAll("[data-rucksack-count]")) {
      count.textContent = String(snapshot.items.length)
    }

    for (const list of lists) {
      list.replaceChildren()
      for (const item of snapshot.items) {
        const row = document.createElement("li")
        row.className = "rucksack-entry"
        row.dataset.gameItemId = item.id
        row.dataset.gameItemName = item.name
        row.dataset.rucksackSlug = item.id
        row.draggable = true

        const name = document.createElement("span")
        name.className = "rucksack-name"
        name.textContent = item.name
        name.title = item.name

        const quantity = document.createElement("span")
        quantity.className = "rucksack-quantity"
        quantity.textContent = `×${item.quantity}`

        const remove = document.createElement("button")
        remove.type = "button"
        remove.className = "rucksack-remove"
        remove.dataset.gameRemoveItem = item.id
        remove.dataset.rucksackRemoveEntry = item.id
        remove.setAttribute("aria-label", `Remove ${item.name} from your rucksack`)
        remove.textContent = "×"

        row.append(name, quantity, remove)
        list.append(row)
      }
    }
  } finally {
    renderingRucksack = false
  }
}

function renderGameSnapshot(snapshot: import("./core").GameState) {
  renderLegacyInventory(snapshot)
  renderRucksack(snapshot)
  restoreSavedBlocks(snapshot)
}

function showToast(message: string) {
  let container = document.querySelector<HTMLElement>("#wolke-item-toasts")
  if (!container) {
    container = document.createElement("div")
    container.id = "wolke-item-toasts"
    container.setAttribute("aria-live", "polite")
    container.setAttribute("aria-atomic", "false")
    const rightSidebar = document.querySelector<HTMLElement>(".sidebar.right")
    ;(rightSidebar ?? document.body).append(container)
  }

  const toast = document.createElement("div")
  toast.className = "wolke-item-toast"
  toast.setAttribute("role", "status")
  toast.textContent = message
  container.append(toast)

  while (container.children.length > 5) {
    container.firstElementChild?.remove()
  }

  window.setTimeout(() => {
    toast.classList.add("wolke-item-toast-leaving")
    window.setTimeout(() => toast.remove(), 180)
  }, 3200)
}

function showItemPickupToast(event: Event) {
  const detail = (event as CustomEvent<{ name?: unknown; quantity?: unknown }>).detail
  const name = typeof detail?.name === "string" ? detail.name.trim() : ""
  if (!name) return

  const quantity =
    typeof detail.quantity === "number" && detail.quantity > 1 ? ` ×${detail.quantity}` : ""
  showToast(`Aufgenommen: ${name}${quantity}`)
}

function showLevelUpToast() {
  showToast("Level up!")
}

function handleExperienceEvent() {
  void game.execute({ type: "exp_gained" }).catch((error) => {
    console.error("[wolke game] could not award experience", error)
  })
}

/**
 * Read a property of the current page out of the rendered frontmatter block.
 *
 * Quartz renders page frontmatter into `<details class="note-properties">` as a
 * table of key/value rows, so that is the only place the value exists in the
 * browser - the raw frontmatter never reaches the client. Matching on the key
 * column (rather than taking the first row) matters: the table also lists
 * generated properties such as `title` and `modified`.
 */
function currentProperty(property: string): string | null {
  for (const row of document.querySelectorAll("details.note-properties .note-properties-row")) {
    const key = row.querySelector(".note-properties-key")?.textContent?.trim().toLowerCase()
    if (key !== property) continue
    const value = row.querySelector(".note-properties-value")?.textContent?.trim()
    if (!value) return null
    // An explicitly empty property renders a placeholder instead of a value.
    if (!value || value === "—" || row.querySelector(".note-properties-empty")) return null
    return value
  }
  return null
}

function currentLocation(): string | null {
  return currentProperty("location")
}

function currentClan(): string | null {
  return currentProperty("clan")
}

function trackLocation() {
  const location = currentLocation()
  if (!location) return
  void game.execute({
    type: "location_visited",
    location,
    clan: currentClan() ?? undefined,
    page: currentPage(),
  })
}

let navigationTimer: number | undefined

function reconcileNavigation() {
  primeBlocks()
  renderGameSnapshot(game.getSnapshot())
  syncRucksackEntries()
  removeConsumedRucksackSources()
  trackLocation()

  // The installed Rucksack component listens for window-level navigation
  // events. Quartz normally emits one, but browser-history traversal can
  // replace the page before that listener runs, so give it a settled retry.
  window.dispatchEvent(new Event("nav"))
}

function scheduleNavigationReconcile() {
  if (navigationTimer !== undefined) window.clearTimeout(navigationTimer)
  navigationTimer = window.setTimeout(() => {
    navigationTimer = undefined
    requestAnimationFrame(() => reconcileNavigation())
  }, 0)
}

function onClick(event: Event) {
  const target = event.target
  if (!(target instanceof Element)) return

  const rucksackRemove = target.closest("[data-rucksack-remove-entry]")
  if (rucksackRemove) {
    const entry = rucksackRemove.closest("[data-rucksack-slug]")
    const id = rucksackRemove.getAttribute("data-rucksack-remove-entry")
    const name = entry?.querySelector(".rucksack-name")?.textContent?.trim()
    const quantityText = entry?.querySelector(".rucksack-quantity")?.textContent ?? ""
    const quantity = Number.parseInt(quantityText.replace(/[^0-9]/g, ""), 10)
    if (id && name) {
      if (silentRucksackRemovals.has(id)) {
        silentRucksackRemovals.delete(id)
        syncedRucksackEntries.delete(id)
        return
      }
      syncedRucksackEntries.delete(id)
      emitItemEvent("item_placed", {
        item: { id, name, quantity: Number.isFinite(quantity) ? quantity : 1 },
      })
    }
    return
  }

  const inventoryRemove = target.closest("[data-game-remove-item]")
  if (inventoryRemove) {
    const id = inventoryRemove.getAttribute("data-game-remove-item")
    const name = inventoryRemove
      .closest("[data-game-item-name]")
      ?.getAttribute("data-game-item-name")
    if (id) emitItemEvent("item_placed", { item: { id, name: name || id } })
    return
  }

  // Keep the original item-copy mechanic backed by the shared runtime too.
  const copyButton = target.closest(".clipboard-button, .copy-button")
  const block = copyButton?.closest("pre") ?? copyButton?.closest("figure")?.querySelector("pre")
  if (block && isLetterBlock(block)) {
    stashLetterBlock(block)
    return
  }
  if (block && isWingsBlock(block)) {
    collectWingsBlock(block)
    return
  }
}

const runtimeFlags = window as Window & { __wolkeRuntimeInitialized?: boolean }
if (!runtimeFlags.__wolkeRuntimeInitialized) {
  runtimeFlags.__wolkeRuntimeInitialized = true
  document.addEventListener("item_placed", handleItemEvent)
  document.addEventListener("item_taken", handleItemEvent)
  window.addEventListener("wolke7000:item-picked-up", showItemPickupToast)
  window.addEventListener("wolke7000:exp", handleExperienceEvent)
  window.addEventListener("wolke7000:level-up", showLevelUpToast)
  document.addEventListener("click", onClick, true)
  document.addEventListener("dragstart", onDragStart)
  document.addEventListener("dragover", onDragOver)
  document.addEventListener("dragleave", onDragLeave)
  document.addEventListener("dragend", onDragEnd)
  document.addEventListener("drop", onDrop)

  primeBlocks()
  game.subscribe(renderGameSnapshot)
  document.addEventListener("nav", scheduleNavigationReconcile)
  document.addEventListener("nav:end", scheduleNavigationReconcile)
  document.addEventListener("nav", seedOpenWingsPigeons)
  for (const event of ["popstate", "hashchange", "pageshow"] as const) {
    window.addEventListener(event, scheduleNavigationReconcile)
  }

  const rucksackObserver = new MutationObserver((mutations) => {
    inspectChangedBlocks(mutations)
    syncRucksackEntries()
    removeConsumedRucksackSources()
    restoreSavedBlocks(game.getSnapshot())
    renderRucksack(game.getSnapshot())
  })
  if (document.body) {
    rucksackObserver.observe(document.body, { childList: true, subtree: true })
    syncRucksackEntries()
    seedOpenWingsPigeons()
  }
}
