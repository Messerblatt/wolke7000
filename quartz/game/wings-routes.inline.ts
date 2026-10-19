import { getWolke } from "./browser"

const game = getWolke()

function renderRoutes() {
  const root = document.querySelector<HTMLElement>("[data-wolke-wings-routes]")
  if (!root) return

  const list = root.querySelector<HTMLElement>("[data-wolke-wings-routes-list]")
  if (!list) return
  list.replaceChildren()

  const letters = game.letters.filter((letter) => letter.status === "sent")
  if (letters.length === 0) {
    const empty = document.createElement("p")
    empty.className = "wolke-wings-routes-empty"
    empty.textContent = "No messages"
    list.append(empty)
    return
  }

  for (const letter of [...letters].reverse()) {
    const route = document.createElement("article")
    route.className = "wolke-wings-route"

    const title = document.createElement("strong")
    title.textContent = `${letter.sender} → ${letter.destination}`

    const metadata = document.createElement("dl")
    const fields: [string, string][] = [
      ["Status", "In flight"],
      ["Time elapsed", "—"],
      ["~ time left", "—"],
      ["Letter", letter.id],
    ]
    for (const [label, value] of fields) {
      const term = document.createElement("dt")
      term.textContent = label
      const detail = document.createElement("dd")
      detail.textContent = value
      metadata.append(term, detail)
    }

    route.append(title, metadata)
    list.append(route)
  }
}

function initializeRoutes() {
  const root = document.querySelector<HTMLElement>("[data-wolke-wings-routes]")
  if (!root || root.dataset.wolkeBound === "true") return
  root.dataset.wolkeBound = "true"
  window.addCleanup?.(game.subscribe(() => renderRoutes()))
  renderRoutes()
}

document.addEventListener("nav", initializeRoutes)
document.addEventListener("render", initializeRoutes)
