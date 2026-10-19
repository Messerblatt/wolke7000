import { getWolke } from "./browser"
import type { GameState } from "./core"
import type { UnlockCondition, UnlockConfig, UnlockFeature } from "./unlock-config"

type UnlockWindow = Window & {
  __wolkeUnlockConfig?: UnlockConfig
  __wolkeUnlocksInitialized?: boolean
}

const rootWindow = window as UnlockWindow
const config: UnlockConfig = rootWindow.__wolkeUnlockConfig ?? {
  version: 1,
  redirect: "/exilium-ag",
  defaults: { lockedByDefault: true },
  features: [],
}
const game = getWolke()
let evaluation = 0

function identifier(value: string): string {
  return decodeURIComponent(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^\p{L}\p{N}\s/-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function currentPath(): string {
  const path = decodeURIComponent(window.location.pathname).replace(/^\/+|\/+$/g, "")
  return identifier(path === "" || path === "index" ? "index" : path)
}

function snapshotHasItem(snapshot: GameState, value: string): boolean {
  const target = identifier(value)
  return snapshot.items.some((item) => item.id === value || identifier(item.name) === target)
}

function featureById(id: string): UnlockFeature | undefined {
  return config.features.find((feature) => feature.id === id)
}

function featureUnlocked(id: string, snapshot: GameState, stack = new Set<string>()): boolean {
  if (stack.has(id)) return false
  const feature = featureById(id)
  if (!feature || !feature.unlock) return !config.defaults.lockedByDefault

  const nextStack = new Set(stack)
  nextStack.add(id)
  return conditionMet(feature.unlock, snapshot, nextStack)
}

function conditionMet(
  condition: UnlockCondition,
  snapshot: GameState,
  stack: Set<string>,
): boolean {
  if (condition.exp !== undefined && snapshot.exp < condition.exp) return false
  if (condition.item !== undefined && !snapshotHasItem(snapshot, condition.item)) return false
  if (condition.discovery !== undefined && !snapshot.discoveries.includes(condition.discovery))
    return false

  if (condition.clan !== undefined) {
    const clan = typeof condition.clan === "string" ? condition.clan : condition.clan.id
    const level = typeof condition.clan === "string" ? 1 : condition.clan.level
    const target = identifier(clan)
    const hasClan = Object.entries(snapshot.clans).some(
      ([known, count]) => identifier(known) === target && count >= level,
    )
    if (!hasClan) return false
  }

  if (condition.feature !== undefined && !featureUnlocked(condition.feature, snapshot, stack)) {
    return false
  }
  if (
    condition.all !== undefined &&
    !condition.all.every((entry) => conditionMet(entry, snapshot, new Set(stack)))
  ) {
    return false
  }
  if (
    condition.any !== undefined &&
    !condition.any.some((entry) => conditionMet(entry, snapshot, new Set(stack)))
  ) {
    return false
  }
  return true
}

function pathMatches(path: string, rule: string): boolean {
  const normalizedRule = identifier(rule.replace(/\/\*\*$/, "").replace(/\/$/, ""))
  return (
    Boolean(normalizedRule) && (path === normalizedRule || path.startsWith(`${normalizedRule}/`))
  )
}

function contentFeatureForPath(path: string): UnlockFeature | undefined {
  return config.features.find((feature) => feature.paths?.some((rule) => pathMatches(path, rule)))
}

function redirectLockedPage() {
  const target = config.redirect.startsWith("/") ? config.redirect : `/${config.redirect}`
  const destination = new URL(target, window.location.origin)
  if (identifier(destination.pathname) === currentPath()) return
  if (typeof window.spaNavigate === "function") void window.spaNavigate(destination, false)
  else window.location.assign(destination.href)
}

function hideLockedExplorerLinks(snapshot: GameState) {
  for (const link of document.querySelectorAll<HTMLAnchorElement>(".explorer a[href]")) {
    let path = ""
    try {
      path = identifier(new URL(link.href, window.location.href).pathname)
    } catch {
      continue
    }
    const feature = contentFeatureForPath(path)
    const locked = feature !== undefined && !featureUnlocked(feature.id, snapshot)
    ;(link.closest<HTMLElement>("li") ?? link).hidden = locked
  }
}

function applyUnlocks() {
  const currentEvaluation = ++evaluation
  const snapshot = game.getSnapshot()

  for (const element of document.querySelectorAll<HTMLElement>("[data-wolke-feature]")) {
    const feature = featureById(element.dataset.wolkeFeature ?? "")
    if (feature) element.hidden = !featureUnlocked(feature.id, snapshot)
  }

  for (const feature of config.features) {
    if (!feature.selectors) continue
    const locked = !featureUnlocked(feature.id, snapshot)
    for (const selector of feature.selectors) {
      try {
        document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
          element.hidden = locked
          element.toggleAttribute("data-wolke-locked", locked)
        })
      } catch {
        // Invalid future selectors must not break the unlock engine.
      }
    }
  }

  hideLockedExplorerLinks(snapshot)
  const lockedFeature = contentFeatureForPath(currentPath())
  if (
    currentEvaluation === evaluation &&
    lockedFeature &&
    !featureUnlocked(lockedFeature.id, snapshot)
  ) {
    redirectLockedPage()
  }
}

function interceptLockedLink(event: Event) {
  const target = event.target
  if (!(target instanceof Element)) return
  const link = target.closest<HTMLAnchorElement>("a[href]")
  if (!link) return

  let path = ""
  try {
    path = identifier(new URL(link.href, window.location.href).pathname)
  } catch {
    return
  }
  const feature = contentFeatureForPath(path)
  if (!feature || featureUnlocked(feature.id, game.getSnapshot())) return
  event.preventDefault()
  redirectLockedPage()
}

if (!rootWindow.__wolkeUnlocksInitialized) {
  rootWindow.__wolkeUnlocksInitialized = true
  document.addEventListener("nav", applyUnlocks)
  document.addEventListener("render", applyUnlocks)
  document.addEventListener("click", interceptLockedLink, true)
  game.subscribe(() => applyUnlocks())
  if (document.body) {
    new MutationObserver(() => applyUnlocks()).observe(document.body, {
      childList: true,
      subtree: true,
    })
  }
  void applyUnlocks()
}
