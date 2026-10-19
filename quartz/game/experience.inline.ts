import { getWolke } from "./browser"

const game = getWolke()

function renderExperience() {
  const root = document.querySelector<HTMLElement>("[data-wolke-experience]")
  if (!root) return
  const exp = game.exp
  const level = Math.floor(exp / 5)
  const progress = exp % 5
  root.querySelector<HTMLElement>("[data-wolke-exp-value]")!.textContent = `${exp} EXP`
  root.querySelector<HTMLElement>("[data-wolke-exp-level]")!.textContent = `Level ${level}`
  root.querySelector<HTMLElement>("[data-wolke-exp-fill]")!.style.width = `${(progress / 5) * 100}%`
}

function initializeExperience() {
  const root = document.querySelector<HTMLElement>("[data-wolke-experience]")
  if (!root || root.dataset.wolkeBound === "true") return
  root.dataset.wolkeBound = "true"
  window.addCleanup?.(game.subscribe(() => renderExperience()))
  renderExperience()
}

document.addEventListener("nav", initializeExperience)
document.addEventListener("render", initializeExperience)
