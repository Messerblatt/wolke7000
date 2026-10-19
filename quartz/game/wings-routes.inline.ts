import { getWolke } from "./browser"

const game = getWolke()

function renderRoutes() {
  const root = document.querySelector<HTMLElement>("[data-wolke-wings-routes]")
  const list = root?.querySelector<HTMLElement>("[data-wolke-wings-routes-list]")
  if (!root || !list) return
  list.replaceChildren()
  const empty = document.createElement("p")
  empty.textContent = "No active routes"
  list.append(empty)
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
