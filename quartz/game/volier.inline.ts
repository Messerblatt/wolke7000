import { getWolke } from "./browser"
import { PLAYER_VOLIER_CAPACITY, VOLIER_DAILY_LIMIT } from "./core"

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

function playerVolier() {
  return game.pigeons.filter(
    (pigeon) => pigeon.status === "available" && pigeon.currentLocation === "player-volier",
  )
}

function renderVolier() {
  const root = document.querySelector<HTMLElement>("[data-wolke-volier]")
  if (!root) return

  const available = game.pigeons.filter(
    (pigeon) => pigeon.status === "available" && pigeon.currentLocation === "player-volier",
  )
  const stock = game.pigeons.filter(
    (pigeon) => pigeon.status === "available" && pigeon.currentLocation === "tempelhof-diskoord",
  )
  const list = root.querySelector<HTMLElement>("[data-wolke-volier-list]")
  const button = root.querySelector<HTMLButtonElement>("[data-wolke-get-wings]")
  const remaining = Math.max(
    0,
    Math.min(
      VOLIER_DAILY_LIMIT - (game.volierClaims.date === today() ? game.volierClaims.count : 0),
      PLAYER_VOLIER_CAPACITY - available.length,
    ),
  )

  if (button) {
    button.hidden = !isTempelhof()
    button.disabled = stock.length === 0 || remaining === 0
    button.title = remaining === 0 ? "Daily Limit Reached" : "Get Wings"
  }
  if (!list) return

  list.replaceChildren()
  for (const pigeon of available) {
    const icon = document.createElement("img")
    icon.className = "wolke-volier-pigeon"
    icon.src = "/imgs/ui/wings.png"
    icon.alt = `Pigeon from ${pigeon.homeLoft}`
    icon.title = `${pigeon.homeLoft} · ${pigeon.status}`
    list.append(icon)
  }

  renderSendSelections(root)
}

function renderSendSelections(root: HTMLElement) {
  const letters = root.querySelector<HTMLSelectElement>("[data-wolke-letter-select]")
  const wings = root.querySelector<HTMLSelectElement>("[data-wolke-wing-select]")
  if (!letters || !wings) return

  letters.replaceChildren()
  for (const letter of game.letters.filter((entry) => entry.status === "received")) {
    const option = document.createElement("option")
    option.value = letter.id
    option.textContent = `${letter.id} → ${letter.destination}`
    letters.append(option)
  }

  wings.replaceChildren()
  for (const pigeon of playerVolier()) {
    const option = document.createElement("option")
    option.value = pigeon.id
    option.textContent = `${pigeon.id} · ${pigeon.homeLoft}`
    wings.append(option)
  }
}

function openDialog() {
  const root = document.querySelector<HTMLElement>("[data-wolke-volier]")
  const dialog = root?.querySelector<HTMLDialogElement>("[data-wolke-volier-dialog]")
  const select = root?.querySelector<HTMLSelectElement>("[data-wolke-volier-loft]")
  if (!root || !dialog || !select) return

  select.replaceChildren()
  const config = (window as Window & { __wolkeOpenWingsConfig?: { dovecotes?: string[] } })
    .__wolkeOpenWingsConfig
  for (const homeLoft of config?.dovecotes ?? []) {
    const option = document.createElement("option")
    const stock = game.pigeons.filter(
      (pigeon) =>
        pigeon.homeLoft === homeLoft &&
        pigeon.status === "available" &&
        pigeon.currentLocation === "tempelhof-diskoord",
    ).length
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

  const quantity = Math.min(
    PLAYER_VOLIER_CAPACITY - playerVolier().length,
    Math.max(1, Number.parseInt(quantityInput.value, 10) || 1),
  )
  const ids = game.pigeons
    .filter(
      (pigeon) =>
        pigeon.homeLoft === select.value &&
        pigeon.status === "available" &&
        pigeon.currentLocation === "tempelhof-diskoord",
    )
    .slice(0, quantity)
    .map((pigeon) => pigeon.id)
  if (ids.length > 0) {
    void game.execute({ type: "pigeons_claimed", pigeonIds: ids, date: today() })
  }
  dialog.close()
}

function sendLetter() {
  const root = document.querySelector<HTMLElement>("[data-wolke-volier]")
  const dialog = root?.querySelector<HTMLDialogElement>("[data-wolke-volier-info-dialog]")
  const letters = root?.querySelector<HTMLSelectElement>("[data-wolke-letter-select]")
  const wings = root?.querySelector<HTMLSelectElement>("[data-wolke-wing-select]")
  if (!root || !dialog || !letters || !wings || !letters.value || !wings.value) return

  const letter = game.letters.find(
    (entry) => entry.id === letters.value && entry.status === "received",
  )
  if (!letter) return
  void game.execute({
    type: "letter_sent",
    pigeonId: wings.value,
    letter,
  })
  dialog.close()
}

function showLetterSentToast() {
  const toast = document.createElement("div")
  toast.className = "wolke-letter-toast"
  toast.textContent = "Letter sent"
  document.body.append(toast)
  window.setTimeout(() => toast.remove(), 2600)
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
  root.querySelector("[data-wolke-volier-show-all]")?.addEventListener("click", () => {
    root.querySelector<HTMLDialogElement>("[data-wolke-volier-info-dialog]")?.showModal()
  })
  root.querySelector("[data-wolke-volier-close-info]")?.addEventListener("click", () => {
    root.querySelector<HTMLDialogElement>("[data-wolke-volier-info-dialog]")?.close()
  })
  root.querySelector("[data-wolke-send-letter]")?.addEventListener("click", sendLetter)
  const flags = window as Window & { __wolkeLetterToastInitialized?: boolean }
  if (!flags.__wolkeLetterToastInitialized) {
    flags.__wolkeLetterToastInitialized = true
    window.addEventListener("wolke7000:letter-sent", showLetterSentToast)
  }
  window.addCleanup?.(game.subscribe(() => renderVolier()))
  renderVolier()
}

document.addEventListener("nav", initializeVolier)
document.addEventListener("render", initializeVolier)
