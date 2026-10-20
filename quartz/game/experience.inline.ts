import { getWolke } from "./runtime/browser"

const game = getWolke()
let levelUpPending = false

function renderExperience(snapshot: { exp?: number }) {
  const root = document.querySelector<HTMLElement>("[data-wolke-experience]")
  if (!root) return

  const exp = Number.isInteger(snapshot.exp) && (snapshot.exp ?? 0) >= 0 ? (snapshot.exp ?? 0) : 0
  const level = Math.floor(exp / 5)
  const progress = exp % 5
  const fill = root.querySelector<HTMLElement>("[data-wolke-exp-fill]")
  const value = root.querySelector<HTMLElement>("[data-wolke-exp-value]")
  const levelLabel = root.querySelector<HTMLElement>("[data-wolke-exp-level]")
  const bar = root.querySelector<HTMLElement>("[data-wolke-exp-bar]")

  if (fill) fill.style.width = `${(progress / 5) * 100}%`
  if (value) value.textContent = `${exp} EXP`
  if (levelLabel) levelLabel.textContent = `Level ${level}`
  bar?.setAttribute("aria-valuenow", String(progress))
  root.classList.toggle("is-level-up", levelUpPending)
}

function initializeExperience() {
  const root = document.querySelector<HTMLElement>("[data-wolke-experience]")
  if (!root || !game || root.dataset.wolkeBound === "true") return

  root.dataset.wolkeBound = "true"
  root.addEventListener("click", () => {
    levelUpPending = false
    renderExperience(game.getSnapshot())
    const destination = new URL("/dreams.canvas.html", window.location.origin)
    if (typeof window.spaNavigate === "function") void window.spaNavigate(destination, false)
    else window.location.assign(destination.href)
  })
  const unsubscribe = game.subscribe(renderExperience)
  window.addCleanup?.(unsubscribe)
}

document.addEventListener("nav", initializeExperience)
document.addEventListener("render", initializeExperience)
window.addEventListener("wolke7000:level-up", () => {
  levelUpPending = true
  renderExperience(game.getSnapshot())
})
