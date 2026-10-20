import { getWolke } from "./runtime/browser"

type ExperienceUnlockConfig = {
  canvas: string
  levels: { level: number; nodes: string[] }[]
}

const game = getWolke()
const config = (window as Window & { __wolkeExperienceUnlocks?: ExperienceUnlockConfig })
  .__wolkeExperienceUnlocks ?? { canvas: "dreams.canvas", levels: [] }

function isDreamsCanvas(): boolean {
  return window.location.pathname.toLowerCase().includes("dreams.canvas")
}

function applyCanvasUnlocks() {
  if (!isDreamsCanvas()) return
  const level = Math.floor(game.exp / 5)
  const allowed = new Set(
    config.levels.filter((entry) => entry.level <= level).flatMap((entry) => entry.nodes),
  )
  document.querySelectorAll<HTMLElement>(".canvas-node[data-node-id]").forEach((node) => {
    node.hidden = !allowed.has(node.dataset.nodeId ?? "")
  })
}

function initializeCanvasUnlocks() {
  applyCanvasUnlocks()
  window.setTimeout(applyCanvasUnlocks, 0)
}

document.addEventListener("nav", initializeCanvasUnlocks)
document.addEventListener("render", initializeCanvasUnlocks)
game.subscribe(applyCanvasUnlocks)
new MutationObserver(applyCanvasUnlocks).observe(document.body, { childList: true, subtree: true })
