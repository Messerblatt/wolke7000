import { getWolke } from "./runtime/browser"

const game = getWolke()
const pageSelector = 'body[data-slug="characters/kokolores"]'
const calloutSelector = `${pageSelector} .callout`
const epiphanySelector = `${pageSelector} .wolke-epiphany-callout`
const lightAuraUrl = "/audio/light-aura.mp3"
const audioDelay = 1000
const audioVolume = 0.18
const hoverDuration = 5000
const activeCallouts = new Set<HTMLElement>()
const states = new WeakMap<
  HTMLElement,
  {
    frame: number
    rewarded: boolean
    progress: number
    audioTimer?: number
    audio?: HTMLAudioElement
  }
>()

function itemPool(): string[] {
  const items = new Set<string>()
  document
    .querySelectorAll<HTMLElement>(`${pageSelector} pre[data-language="item"]`)
    .forEach((block) => {
      block.textContent
        ?.split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((item) => items.add(item))
    })
  return [...items]
}

function reset(callout: HTMLElement) {
  const state = states.get(callout)
  if (state) window.cancelAnimationFrame(state.frame)
  if (state?.audioTimer !== undefined) window.clearTimeout(state.audioTimer)
  if (state?.audio && !state.audio.ended) {
    state.audio.pause()
    state.audio.currentTime = 0
  }
  states.delete(callout)
  activeCallouts.delete(callout)
  callout.classList.remove("is-kokolores-shining", "is-kokolores-rewarded")
  callout.style.setProperty("--koko-holy-light", "0")
  updateBackgroundLight()
}

function updateBackgroundLight(callout?: HTMLElement, progress = 0) {
  const body = document.body
  if (!body.matches(pageSelector)) return

  if (!callout || progress <= 0) {
    const active = activeCallouts.values().next().value as HTMLElement | undefined
    const activeState = active ? states.get(active) : undefined
    if (active && activeState) {
      updateBackgroundLight(active, activeState.progress ?? 0)
      return
    }
    body.classList.remove("is-kokolores-lighting")
    body.style.setProperty("--koko-background-light", "0")
    return
  }

  const bounds = callout.getBoundingClientRect()
  body.style.setProperty("--koko-light-x", `${bounds.left + bounds.width / 2}px`)
  body.style.setProperty("--koko-light-y", `${bounds.top + bounds.height / 2}px`)
  body.style.setProperty("--koko-background-light", String(progress))
  body.classList.add("is-kokolores-lighting")
}

function playLightAura(): HTMLAudioElement {
  const audio = new Audio(lightAuraUrl)
  audio.preload = "auto"
  audio.volume = audioVolume
  void audio.play().catch(() => {})
  return audio
}

function reward(callout: HTMLElement) {
  const items = itemPool()
  if (items.length === 0) return

  const item = items[Math.floor(Math.random() * items.length)]
  callout.classList.add("is-kokolores-rewarded")
  void game
    .execute({
      type: "item_taken",
      item: { name: item, source: "/characters/kokolores" },
    })
    .catch((error) => console.error("[wolke game] could not award Kokolores item", error))
}

function start(callout: HTMLElement) {
  if (states.has(callout)) return

  const startedAt = performance.now()
  const state: {
    frame: number
    rewarded: boolean
    progress: number
    audioTimer?: number
    audio?: HTMLAudioElement
  } = { frame: 0, rewarded: false, progress: 0 }
  states.set(callout, state)
  activeCallouts.add(callout)
  callout.classList.add("is-kokolores-shining")
  callout.style.setProperty("--koko-holy-light", "0.12")
  updateBackgroundLight(callout, 0.12)
  const delay = callout.matches(epiphanySelector) ? 0 : audioDelay
  state.audioTimer = window.setTimeout(() => {
    if (states.get(callout) === state) state.audio = playLightAura()
  }, delay)

  const shine = (now: number) => {
    if (states.get(callout) !== state) return
    const elapsed = Math.min(1, (now - startedAt) / hoverDuration)
    const progress = Math.min(1, 0.12 + elapsed * 0.88)
    state.progress = progress
    callout.style.setProperty("--koko-holy-light", String(progress))
    updateBackgroundLight(callout, progress)

    if (elapsed >= 1) {
      state.frame = 0
      if (!state.rewarded) {
        state.rewarded = true
        reward(callout)
      }
      return
    }

    state.frame = window.requestAnimationFrame(shine)
  }

  state.frame = window.requestAnimationFrame(shine)
}

function initialize() {
  if (!document.body.matches(pageSelector)) return

  document.querySelectorAll<HTMLElement>(calloutSelector).forEach((callout) => {
    if (callout.dataset.kokoloresHoverBound === "true") return
    callout.dataset.kokoloresHoverBound = "true"
    callout.classList.add("koko-hover-callout")
    callout.addEventListener("pointerenter", () => start(callout))
    callout.addEventListener("pointerleave", () => reset(callout))
    callout.addEventListener("focusin", () => start(callout))
    callout.addEventListener("focusout", () => reset(callout))
  })
}

function resetAll() {
  for (const callout of activeCallouts) reset(callout)
}

document.addEventListener("nav", () => {
  resetAll()
  initialize()
})
document.addEventListener("render", initialize)
