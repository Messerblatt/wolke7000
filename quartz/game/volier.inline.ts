import { getWolke } from "./browser"
import { VOLIER_DAILY_LIMIT } from "./core"

const game = getWolke()

function today(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function isTempelhof(): boolean {
  return window.location.pathname.toLowerCase().includes("tempelhof-diskoord")
}

function renderVolier() {
  const root = document.querySelector<HTMLElement>("[data-wolke-volier]")
  if (!root) return

  const available = game.pigeons.filter(
    (pigeon) => pigeon.status === "available" && pigeon.currentLocation === "volier",
  )
  const count = root.querySelector<HTMLElement>("[data-wolke-volier-count]")
  const list = root.querySelector<HTMLElement>("[data-wolke-volier-list]")
  const button = root.querySelector<HTMLButtonElement>("[data-wolke-get-wings]")
  const remaining = Math.max(
    0,
    VOLIER_DAILY_LIMIT - (game.volierClaims.date === today() ? game.volierClaims.count : 0),
  )

  if (count) count.textContent = `${available.length} verfügbar`
  if (button) {
    button.hidden = !isTempelhof()
    button.disabled = available.length === 0 || remaining === 0
    button.title = remaining === 0 ? "Daily Limit Reached" : "Get Wings"
  }
  if (!list) return

  list.replaceChildren()
  const groups = new Map<string, typeof available>()
  for (const pigeon of available) {
    const group = groups.get(pigeon.homeLoft) ?? []
    group.push(pigeon)
    groups.set(pigeon.homeLoft, group)
  }
  for (const [homeLoft, pigeons] of groups) {
    const row = document.createElement("li")
    row.textContent = `${homeLoft}: ${pigeons.length} · available`
    list.append(row)
  }
}

function openDialog() {
  const root = document.querySelector<HTMLElement>("[data-wolke-volier]")
  const dialog = root?.querySelector<HTMLDialogElement>("[data-wolke-volier-dialog]")
  const select = root?.querySelector<HTMLSelectElement>("[data-wolke-volier-loft]")
  if (!root || !dialog || !select) return

  select.replaceChildren()
  const available = game.pigeons.filter(
    (pigeon) => pigeon.status === "available" && pigeon.currentLocation === "volier",
  )
  for (const homeLoft of [...new Set(available.map((pigeon) => pigeon.homeLoft))]) {
    const option = document.createElement("option")
    option.value = homeLoft
    option.textContent = homeLoft
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
  const ids = game.pigeons
    .filter(
      (pigeon) =>
        pigeon.homeLoft === select.value &&
        pigeon.status === "available" &&
        pigeon.currentLocation === "volier",
    )
    .slice(0, quantity)
    .map((pigeon) => pigeon.id)
  if (ids.length > 0) {
    void game.execute({ type: "pigeons_claimed", pigeonIds: ids, date: today() })
  }
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
