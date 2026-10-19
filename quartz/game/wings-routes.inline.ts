import { getWolke } from "./browser"

const game = getWolke()

function renderRoutes() {
  const root = document.querySelector<HTMLElement>("[data-wolke-wings-routes]")
  if (!root) return

  const list = root.querySelector<HTMLElement>("[data-wolke-wings-routes-list]")
  if (!list) return
  list.replaceChildren()

  const messages = game.openWingsMessages
  if (messages.length === 0) {
    const empty = document.createElement("p")
    empty.className = "wolke-wings-routes-empty"
    empty.textContent = "Keine Meldungen"
    list.append(empty)
    return
  }

  for (const message of [...messages].reverse()) {
    const route = document.createElement("article")
    route.className = "wolke-wings-route"

    const title = document.createElement("strong")
    title.textContent = `${message.sender} → ${message.destination}`

    const metadata = document.createElement("dl")
    const fields: [string, string][] = [
      ["Status", "Meldung empfangen"],
      ["Zeit vergangen", "—"],
      ["~ verbleibend", "—"],
      ["Meldung", message.messageId],
      ["Revision", String(message.revision)],
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
