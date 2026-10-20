import { evaluateCondition, type Condition, type WolkeRuntimeState } from "./conditions"
import { getWolke } from "./runtime/browser"

const game = getWolke()
let evaluation = 0

function identifier(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

const state: WolkeRuntimeState = {
  async hasItem(id, quantity = 1) {
    const target = identifier(id)
    return game
      .getSnapshot()
      .items.some(
        (item) => (item.id === id || identifier(item.name) === target) && item.quantity >= quantity,
      )
  },
  async hasDiscovery(id) {
    return game.getSnapshot().discoveries.includes(id)
  },
  async hasClanLevel(clan, level) {
    const target = identifier(clan)
    return Object.entries(game.getSnapshot().clans).some(
      ([knownClan, count]) => identifier(knownClan) === target && count >= level,
    )
  },
  async hasLevel(level) {
    return Math.floor(game.exp / 5) >= level
  },
}

function readCondition(element: HTMLElement): Condition | undefined {
  const type = element.dataset.conditionType
  const value = element.dataset.conditionValue?.trim()
  if (type !== "requires-level" && !value) return

  if (type === "requires-item" || type === "unless-item" || type === "requires-discovery") {
    if (type === "requires-item") {
      const quantity = Number(element.dataset.conditionQuantity || 1)
      if (!Number.isSafeInteger(quantity) || quantity < 1) return
      return { type, value: value!, quantity }
    }
    return { type, value: value! }
  }

  if (type === "requires-clan") {
    const level = Number(element.dataset.conditionLevel)
    if (!Number.isSafeInteger(level) || level < 1) return
    return { type, clan: value!, level }
  }

  if (type === "requires-level") {
    const level = Number(element.dataset.conditionLevel)
    if (!Number.isSafeInteger(level) || level < 1) return
    return { type, level }
  }

  return
}

async function evaluateAll() {
  const currentEvaluation = ++evaluation
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(".wolke-conditional[data-condition-type]"),
  )

  // Always fail closed while asynchronous state is being read.
  elements.forEach((element) => {
    element.hidden = true
  })

  await Promise.all(
    elements.map(async (element) => {
      const condition = readCondition(element)
      if (!condition) return

      let allowed = false
      try {
        allowed = await evaluateCondition(condition, state)
      } catch {
        allowed = false
      }

      if (currentEvaluation === evaluation) {
        element.hidden = !allowed
      }
    }),
  )
}

const flags = window as Window & { __wolkeConditionsInitialized?: boolean }
if (!flags.__wolkeConditionsInitialized) {
  flags.__wolkeConditionsInitialized = true
  document.addEventListener("nav", evaluateAll)
  document.addEventListener("render", evaluateAll)
  document.addEventListener("wolke:state-changed", evaluateAll)
  game.subscribe(() => evaluateAll())
  void evaluateAll()
}
