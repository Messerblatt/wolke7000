// @ts-nocheck

const STORAGE_KEY = "wolke7000.inventory.v1"

type InventoryItem = {
  id: string
  name: string
  source: string
  acquiredAt: number
}

function getInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)

    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error("Could not read inventory:", error)
    return []
  }
}

function saveInventory(items: InventoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))

  window.dispatchEvent(
    new CustomEvent("wolke7000:inventory-update", {
      detail: items,
    }),
  )
}

function removeItem(id: string) {
  const inventory = getInventory().filter((item) => item.id !== id)

  saveInventory(inventory)
}

function renderInventory() {
  const root = document.querySelector("[data-inventory]")

  if (!root) {
    return
  }

  const list = root.querySelector("[data-inventory-items]")
  const count = root.querySelector("[data-inventory-count]")
  const empty = root.querySelector("[data-inventory-empty]")

  if (!list || !count || !empty) {
    return
  }

  const inventory = getInventory()

  count.textContent = String(inventory.length)

  list.replaceChildren()

  if (inventory.length === 0) {
    empty.removeAttribute("hidden")
    return
  }

  empty.setAttribute("hidden", "")

  for (const item of inventory) {
    const li = document.createElement("li")
    li.className = "inventory-item"

    const name = document.createElement("span")
    name.className = "inventory-item-name"
    name.textContent = item.name

    const removeButton = document.createElement("button")
    removeButton.type = "button"
    removeButton.className = "inventory-remove"
    removeButton.textContent = "×"
    removeButton.title = "Aus Inventar entfernen"

    removeButton.addEventListener("click", () => {
      removeItem(item.id)
    })

    li.append(name, removeButton)
    list.appendChild(li)
  }
}

function setupInventoryPanel() {
  const root = document.querySelector("[data-inventory]")

  if (!root || root.dataset.initialized === "true") {
    return
  }

  root.dataset.initialized = "true"

  const toggle = root.querySelector(".inventory-toggle")
  const panel = root.querySelector("[data-inventory-panel]")
  const close = root.querySelector("[data-inventory-close]")

  if (!toggle || !panel) {
    return
  }

  toggle.addEventListener("click", () => {
    const isOpen = !panel.hasAttribute("hidden")

    if (isOpen) {
      panel.setAttribute("hidden", "")
      toggle.setAttribute("aria-expanded", "false")
    } else {
      panel.removeAttribute("hidden")
      toggle.setAttribute("aria-expanded", "true")
    }
  })

  close?.addEventListener("click", () => {
    panel.setAttribute("hidden", "")
    toggle.setAttribute("aria-expanded", "false")
  })
}

function initializeInventory() {
  setupInventoryPanel()
  renderInventory()
}

document.addEventListener("nav", initializeInventory)
document.addEventListener("render", initializeInventory)

window.addEventListener("wolke7000:inventory-update", renderInventory)
