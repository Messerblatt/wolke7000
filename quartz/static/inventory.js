const STORAGE_KEY = "wolke7000.inventory.v1"

function getInventory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) return []

    const parsed = JSON.parse(raw)

    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error("Inventory could not be read:", error)
    return []
  }
}

function saveInventory(items) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items)
  )

  window.dispatchEvent(
    new CustomEvent("wolke7000:inventory-update")
  )
}

function addItem(name) {
  const inventory = getInventory()

  if (inventory.some(item => item.name === name)) {
    return
  }

  inventory.push({
    id: crypto.randomUUID(),
    name,
    source: window.location.pathname,
    acquiredAt: Date.now(),
  })

  saveInventory(inventory)
}

function removeItem(id) {
  const inventory = getInventory().filter(
    item => item.id !== id
  )

  saveInventory(inventory)
}

function renderInventory() {
  const root = document.querySelector(
    "[data-inventory]"
  )

  if (!root) return

  const list = root.querySelector(
    "[data-inventory-items]"
  )

  const count = root.querySelector(
    "[data-inventory-count]"
  )

  const empty = root.querySelector(
    "[data-inventory-empty]"
  )

  if (!list || !count) return

  const inventory = getInventory()

  count.textContent = String(inventory.length)

  list.replaceChildren()

  if (empty) {
    empty.hidden = inventory.length !== 0
  }

  for (const item of inventory) {
    const li = document.createElement("li")
    li.className = "inventory-item"

    const label = document.createElement("span")
    label.textContent = item.name

    const remove = document.createElement("button")
    remove.type = "button"
    remove.textContent = "×"
    remove.title = "Aus Inventar entfernen"

    remove.addEventListener("click", () => {
      removeItem(item.id)
    })

    li.append(label, remove)
    list.append(li)
  }
}

function initializeItemBlocks() {
  const codes = document.querySelectorAll(
    'code[class*="language-item"]'
  )

  console.log(
    "WOLKE INVENTORY: item blocks:",
    codes.length
  )

  for (const code of codes) {
    const pre = code.closest("pre")

    if (!pre) continue

    if (pre.dataset.inventoryBound === "true") {
      continue
    }

    pre.dataset.inventoryBound = "true"

    // Quartz-Versionen können den Copy-Button
    // unterschiedlich einordnen.
    const container =
      pre.parentElement ?? pre

    const button =
      pre.querySelector(".clipboard-button") ||
      container.querySelector(".clipboard-button") ||
      container.querySelector(".copy-button") ||
      container.querySelector("button")

    if (!button) {
      console.warn(
        "WOLKE INVENTORY: no button found",
        pre
      )

      continue
    }

    button.title = "Ins Inventar aufnehmen"

    button.addEventListener("click", () => {
      const name = code.textContent?.trim()

      if (!name) return

      console.log(
        "WOLKE INVENTORY: adding",
        name
      )

      addItem(name)
    })
  }
}

function initializeInventoryUI() {
  const root = document.querySelector(
    "[data-inventory]"
  )

  if (!root) return

  const toggle = root.querySelector(
    "[data-inventory-toggle]"
  )

  const panel = root.querySelector(
    "[data-inventory-panel]"
  )

  if (
    toggle &&
    panel &&
    toggle.dataset.inventoryBound !== "true"
  ) {
    toggle.dataset.inventoryBound = "true"

    toggle.addEventListener("click", () => {
      panel.hidden = !panel.hidden
    })
  }

  renderInventory()
}

function initializeInventory() {
  initializeInventoryUI()
  initializeItemBlocks()
  renderInventory()
}

// Initialer Seitenaufruf
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeInventory
  )
} else {
  initializeInventory()
}

// Quartz SPA navigation
document.addEventListener(
  "nav",
  initializeInventory
)

window.addEventListener(
  "wolke7000:inventory-update",
  renderInventory
)

console.log("WOLKE INVENTORY SCRIPT LOADED")