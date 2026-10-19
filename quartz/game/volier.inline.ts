import { getWolke } from "./browser"
import { VOLIER_DAILY_LIMIT } from "./core"

const game = getWolke()

function today(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function isTempelhof(): boolean {
  return window.location.pathname.toLowerCase().includes("tempelhof-diskoord")
}

function playerVolier() {
  return game.pigeons.filter(
    (pigeon) => pigeon.status === "available" && pigeon.currentLocation === "player-volier",
  )
}

function tempelhofStock() {
  return game.pigeons.filter(
    (pigeon) => pigeon.status === "available" && pigeon.currentLocation === "tempelhof-diskoord",
  )
}

function renderVolier() {
  const root = document.querySelector<HTMLElement>("[data-wolke-volier]")
  if (!root) return

  const available = playerVolier()
  const stock = tempelhofStock()
  const count = root.querySelector<HTMLElement>("[data-wolke-volier-count]")
  const list = root.querySelector<HTMLElement>("[data-wolke-volier-list]")
  const button = root.querySelector<HTMLButtonElement>("[data-wolke-get-wings]")
  const claimsToday = game.volierClaims.date === today() ? game.volierClaims.count : 0
  const remaining = Math.max(0, VOLIER_DAILY_LIMIT - claimsToday)

  if (count) count.textContent = String(available.length)
  if (button) {
    button.hidden = !isTempelhof()
    button.disabled = stock.length === 0 || remaining === 0
    button.title = remaining === 0 ? "Tageslimit erreicht" : "Flügel abholen"
  }
  if (!list) return
  list.replaceChildren()
  const groups = new Map<string, number>()
  for (const pigeon of available)
    groups.set(pigeon.homeLoft, (groups.get(pigeon.homeLoft) ?? 0) + 1)
  for (const [homeLoft, quantity] of groups) {
    const row = document.createElement("li")
    row.textContent = `${homeLoft}: ${quantity}`
    list.append(row)
  }
}

function openDialog() {
  const root = document.querySelector<HTMLElement>("[data-wolke-volier]")
  const dialog = root?.querySelector<HTMLDialogElement>("[data-wolke-volier-dialog]")
  const select = root?.querySelector<HTMLSelectElement>("[data-wolke-volier-loft]")
  if (!root || !dialog || !select) return

  const config = (window as Window & { __wolkeOpenWingsConfig?: { dovecotes?: string[] } })
    .__wolkeOpenWingsConfig
  select.replaceChildren()
  for (const homeLoft of config?.dovecotes ?? []) {
    const option = document.createElement("option")
    const stock = tempelhofStock().filter((pigeon) => pigeon.homeLoft === homeLoft).length
    option.value = homeLoft
    option.textContent = `${homeLoft} (${stock})`
    option.disabled = stock === 0
    select.append(option)
  }
  dialog.showModal()
}

function claimWings() {
  const root = document.querySelector<HTMLElement>("[data-wolke-volier]")
  const dialog = root?.querySelector<HTMLDialogElement>("[data-wolke-volier-dialog]")
  const select = root?.querySelector<HTMLSelectElement>("[data-wolke-volier-loft]")
  const quantityInput = root?.querySelector<HTMLInputElement>("[data-wolke-volier-quantity]")
  if (!root || !dialog || !select || !quantityInput) return

  const quantity = Math.max(1, Number.parseInt(quantityInput.value, 10) || 1)
  const ids = tempelhofStock()
    .filter((pigeon) => pigeon.homeLoft === select.value)
    .slice(0, quantity)
    .map((pigeon) => pigeon.id)
  if (ids.length > 0) void game.execute({ type: "pigeons_claimed", pigeonIds: ids, date: today() })
  dialog.close()
}

function initializeVolier() {
  const root = document.querySelector<HTMLElement>("[data-wolke-volier]")
  if (!root || root.dataset.wolkeBound === "true") return
  root.dataset.wolkeBound = "true"
  root.querySelector("[data-wolke-get-wings]")?.addEventListener("click", openDialog)
  root.querySelector("[data-wolke-claim-wings]")?.addEventListener("click", claimWings)
  root.querySelector("[data-wolke-close-dialog]")?.addEventListener("click", () => {
    root.querySelector<HTMLDialogElement>("[data-wolke-volier-dialog]")?.close()
  })
  window.addCleanup?.(game.subscribe(() => renderVolier()))
  renderVolier()
}

document.addEventListener("nav", initializeVolier)
document.addEventListener("render", initializeVolier)
