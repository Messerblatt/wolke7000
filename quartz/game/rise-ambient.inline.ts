const pageSelector = 'body[data-slug="rise"]'
const epiphanySelector = `${pageSelector} .wolke-epiphany-callout`
const scrollLightDuration = 1800

type RiseWindow = Window & {
  __wolkeRiseAmbientInitialized?: boolean
}

const riseWindow = window as RiseWindow
if (!riseWindow.__wolkeRiseAmbientInitialized) {
  riseWindow.__wolkeRiseAmbientInitialized = true

  const activeEpiphanies = new Set<HTMLElement>()
  const states = new WeakMap<HTMLElement, { frame: number; startedAt: number }>()
  let scrollFrame: number | null = null

  function setRiseValue(name: string, value: number): void {
    document.body.style.setProperty(name, String(Math.max(0, Math.min(1, value))))
  }

  function updateScrollLight(): void {
    scrollFrame = null
    if (!document.body.matches(pageSelector)) return

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const fromBottom = maxScroll === 0 ? 1 : 1 - window.scrollY / maxScroll
    setRiseValue("--rise-light", fromBottom)
  }

  function scheduleScrollLight(): void {
    if (scrollFrame !== null) return
    scrollFrame = window.requestAnimationFrame(updateScrollLight)
  }

  function currentEpiphanyLight(): number {
    return [...activeEpiphanies]
      .map((active) => Number.parseFloat(active.style.getPropertyValue("--rise-epiphany-light")))
      .reduce((highest, value) => Math.max(highest, Number.isFinite(value) ? value : 0), 0)
  }

  function stopEpiphany(callout: HTMLElement): void {
    const state = states.get(callout)
    if (state) window.cancelAnimationFrame(state.frame)
    states.delete(callout)
    activeEpiphanies.delete(callout)
    callout.classList.remove("is-rise-epiphany")
    callout.style.setProperty("--rise-epiphany-light", "0")
    setRiseValue("--rise-epiphany-light", currentEpiphanyLight())
  }

  function startEpiphany(callout: HTMLElement): void {
    if (states.has(callout)) return

    const state = { frame: 0, startedAt: performance.now() }
    states.set(callout, state)
    activeEpiphanies.add(callout)
    callout.classList.add("is-rise-epiphany")

    const shine = (now: number) => {
      if (states.get(callout) !== state) return
      const progress = Math.min(1, (now - state.startedAt) / scrollLightDuration)
      callout.style.setProperty("--rise-epiphany-light", String(progress))
      setRiseValue("--rise-epiphany-light", Math.max(progress, currentEpiphanyLight()))

      if (progress < 1) state.frame = window.requestAnimationFrame(shine)
    }

    state.frame = window.requestAnimationFrame(shine)
  }

  function initializeEpiphanies(): void {
    if (!document.body.matches(pageSelector)) return

    document.querySelectorAll<HTMLElement>(epiphanySelector).forEach((callout) => {
      if (callout.dataset.riseEpiphanyBound === "true") return
      callout.dataset.riseEpiphanyBound = "true"
      callout.addEventListener("pointerenter", () => startEpiphany(callout))
      callout.addEventListener("pointerleave", () => stopEpiphany(callout))
      callout.addEventListener("focusin", () => startEpiphany(callout))
      callout.addEventListener("focusout", () => stopEpiphany(callout))
    })
  }

  function reset(): void {
    for (const callout of [...activeEpiphanies]) stopEpiphany(callout)
    document.body.style.setProperty("--rise-light", "0")
    document.body.style.setProperty("--rise-epiphany-light", "0")
  }

  function refresh(): void {
    const active = document.body.matches(pageSelector)
    document.documentElement.classList.toggle("rise-ambient", active)
    if (!active) {
      reset()
      return
    }

    updateScrollLight()
    initializeEpiphanies()
  }

  window.addEventListener("scroll", scheduleScrollLight, { passive: true })
  window.addEventListener("resize", scheduleScrollLight, { passive: true })
  document.addEventListener("nav", refresh)
  document.addEventListener("render", refresh)

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh, { once: true })
  } else {
    refresh()
  }
}
