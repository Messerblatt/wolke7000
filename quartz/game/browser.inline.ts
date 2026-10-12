import { getWolke } from "./browser"

const game = getWolke()

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

function handleItemEvent(event: Event) {
  const detail = (event as CustomEvent).detail
  const item = itemFromDetail(detail)
  if (!item) return

  void game.execute({ type: event.type as "item_placed" | "item_taken", item }).then(() => {
    if (typeof detail !== "object" || detail === null) return
    const value = detail as Record<string, unknown>
    if (typeof value.blockId !== "string" || typeof value.after !== "string") return
    return game.execute({
      type: "block_updated",
      block: { id: value.blockId, content: value.after },
    })
  })
}

function emitItemEvent(type: "item_placed" | "item_taken", item: Record<string, unknown>) {
  const detail = { ...item, type }
  document.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }))
  const setting = document.querySelector("[data-event-logging]")?.getAttribute("data-event-logging")
  if (setting === null || setting === undefined || setting === "true") {
    console.log("[wolke game] emitted", detail)
  }
}

function blockItems(button: Element, after: string): Record<string, unknown>[] {
  const block = button.closest("pre") ?? button.closest("figure")?.querySelector("pre")
  const name = button.getAttribute("data-rucksack-name")?.trim()
  if (!block || !name) return []

  const lines = blockContent(block)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const id = button.getAttribute("data-rucksack-toggle-block") ?? undefined
  const blockId = block.dataset.wolkeBlockId ?? blockIdFor(block)
  return lines.map((line, index) => ({
    item: {
      id: index === 0 ? id : undefined,
      name: line,
      source: window.location.pathname,
    },
    blockId,
    before: blockContent(block),
    after,
    language: blockLanguage(block),
  }))
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

function blockName(content: string): string {
  return (
    content
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? ""
  )
}

function blockLanguage(block: Element): string {
  return (
    block.getAttribute("data-language") ??
    block.querySelector("[data-language]")?.getAttribute("data-language") ??
    ""
  )
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
  for (const block of document.querySelectorAll("pre")) {
    blockIdFor(block)
    trackedBlocks.set(block, blockContent(block))
  }
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

    const previousName = blockName(previous)
    const currentName = blockName(current)
    const details = { before: previous, after: current, language: blockLanguage(block) }
    if (!current) {
      emitItemEvent("item_taken", { item: previousName, ...details })
    } else if (!previous) {
      emitItemEvent("item_placed", { item: currentName, ...details })
    } else if (currentName !== previousName) {
      emitItemEvent("item_taken", { item: previousName, ...details })
      emitItemEvent("item_placed", { item: currentName, ...details })
    } else if (current.length > previous.length) {
      emitItemEvent("item_placed", { item: currentName, ...details })
    } else {
      emitItemEvent("item_taken", { item: previousName, ...details })
    }
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

  code.replaceChildren(
    ...content.split("\n").map((line) => {
      const lineElement = document.createElement("span")
      lineElement.setAttribute("data-line", "")
      lineElement.textContent = line || " "
      return lineElement
    }),
  )
}

function restoreSavedBlocks(snapshot: import("./core").GameState) {
  let changed = false
  for (const block of document.querySelectorAll("pre")) {
    const saved = snapshot.blocks.find((candidate) => candidate.id === blockIdFor(block))
    if (!saved || blockContent(block) === saved.content) continue
    writeBlockContent(block, saved.content)
    trackedBlocks.set(block, saved.content)
    changed = true
    if (!saved.content) {
      block.closest("figure")?.querySelector("[data-rucksack-toggle-block]")?.remove()
    }
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

let navigationTimer: number | undefined

function reconcileNavigation() {
  primeBlocks()
  renderGameSnapshot(game.getSnapshot())
  syncRucksackEntries()
  removeConsumedRucksackSources()

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

  // Capture the Rucksack state before its own button handler toggles it.
  const rucksackButton = target.closest("[data-rucksack-toggle-block]")
  if (rucksackButton) {
    const isStashed = rucksackButton.getAttribute("aria-pressed") === "true"
    const parkedBlock =
      rucksackButton.closest("pre") ?? rucksackButton.closest("figure")?.querySelector("pre")
    const originalContent = parkedBlock ? blockContent(parkedBlock) : ""
    const items = blockItems(rucksackButton, isStashed ? originalContent : "")
    if (items.length > 0) {
      const blockId = rucksackButton.getAttribute("data-rucksack-toggle-block")
      if (blockId) {
        if (isStashed) syncedRucksackEntries.delete(blockId)
        else syncedRucksackEntries.add(blockId)
      }
      for (const item of items) {
        emitItemEvent(isStashed ? "item_placed" : "item_taken", item)
      }
    }
    return
  }

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
  const code = copyButton
    ?.closest("pre")
    ?.querySelector("code.language-item, code[class*='language-item']")
  const name = code?.textContent?.trim()
  if (name) emitItemEvent("item_taken", { item: name, source: window.location.pathname })
}

const runtimeFlags = window as Window & { __wolkeRuntimeInitialized?: boolean }
if (!runtimeFlags.__wolkeRuntimeInitialized) {
  runtimeFlags.__wolkeRuntimeInitialized = true
  document.addEventListener("item_placed", handleItemEvent)
  document.addEventListener("item_taken", handleItemEvent)
  document.addEventListener("click", onClick, true)
  document.addEventListener("dragstart", onDragStart)
  document.addEventListener("dragover", onDragOver)
  document.addEventListener("dragleave", onDragLeave)
  document.addEventListener("dragend", onDragEnd)
  document.addEventListener("drop", onDrop)

  game.subscribe(renderGameSnapshot)
  document.addEventListener("nav", scheduleNavigationReconcile)
  document.addEventListener("nav:end", scheduleNavigationReconcile)
  for (const event of ["popstate", "hashchange", "pageshow"] as const) {
    window.addEventListener(event, scheduleNavigationReconcile)
  }

  primeBlocks()
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
  }
}
