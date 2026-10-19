import { getWolke } from "./browser"

const game = getWolke()

function renderInventory() {
  const root = document.querySelector<HTMLElement>("[data-wolke-inventory]")
  if (!root) return
  const entries = game.inventory
  const list = root.querySelector<HTMLElement>("[data-wolke-inventory-list]")
  const allList = root.querySelector<HTMLElement>("[data-wolke-inventory-all]")
  const count = root.querySelector<HTMLElement>("[data-wolke-inventory-count]")
  if (!list || !allList || !count) return

  count.textContent = String(entries.length)
  list.replaceChildren()
  allList.replaceChildren()
  for (const [index, entry] of entries.entries()) {
    const row = document.createElement("li")
    const name = document.createElement("span")
    name.textContent = entry.name
    const quantity = document.createElement("span")
    quantity.textContent = `×${entry.quantity}`
    row.append(name, quantity)
    allList.append(row)
    if (index < 4) list.append(row.cloneNode(true))
  }
}

function initializeInventory() {
  const root = document.querySelector<HTMLElement>("[data-wolke-inventory]")
  if (!root || root.dataset.wolkeBound === "true") return
  root.dataset.wolkeBound = "true"
  root.querySelector("[data-wolke-inventory-show-all]")?.addEventListener("click", () => {
    root.querySelector<HTMLDialogElement>("[data-wolke-inventory-dialog]")?.showModal()
  })
  root.querySelector("[data-wolke-inventory-close]")?.addEventListener("click", () => {
    root.querySelector<HTMLDialogElement>("[data-wolke-inventory-dialog]")?.close()
  })
  window.addCleanup?.(game.subscribe(() => renderInventory()))
  renderInventory()
}

document.addEventListener("nav", initializeInventory)
document.addEventListener("render", initializeInventory)
