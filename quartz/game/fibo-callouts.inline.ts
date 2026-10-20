const pageSelector = 'body[data-slug="characters/fibo"]'
const calloutSelector = [
  `${pageSelector} .callout[data-callout="note"]`,
  `${pageSelector} .callout[data-callout="danger"]`,
  `${pageSelector} .callout[data-callout="alarm"]`,
].join(", ")
const swordChingUrl = "/audio/sword-ching.mp3"
// Quartz slugifies spaces in copied asset filenames to hyphens.
const incomingUrl = "/audio/incoming-incoming.mp3"

type FiboWindow = Window & {
  __wolkeFiboCalloutsInitialized?: boolean
}

const fiboWindow = window as FiboWindow
if (!fiboWindow.__wolkeFiboCalloutsInitialized) {
  fiboWindow.__wolkeFiboCalloutsInitialized = true

  function playEffect(src: string, volume: number): void {
    if (window.__wolkeAudio) {
      const effect = window.__wolkeAudio.play(src)
      effect.volume = volume
      return
    }

    const effect = new Audio(src)
    effect.volume = volume
    void effect.play().catch(() => {})
  }

  function activate(callout: HTMLElement): void {
    const type = callout.dataset.callout
    if (type === "note") {
      callout.classList.add("is-fibo-guardian")
      playEffect(swordChingUrl, 0.55)
      return
    }

    if (type === "danger" || type === "alarm") {
      callout.classList.add("is-fibo-alarm")
      playEffect(incomingUrl, 0.7)
    }
  }

  function deactivate(callout: HTMLElement): void {
    callout.classList.remove("is-fibo-guardian", "is-fibo-alarm")
  }

  function initialize(): void {
    if (!document.body.matches(pageSelector)) return

    document.querySelectorAll<HTMLElement>(calloutSelector).forEach((callout) => {
      if (callout.dataset.fiboCalloutBound === "true") return
      callout.dataset.fiboCalloutBound = "true"
      callout.addEventListener("pointerenter", () => activate(callout))
      callout.addEventListener("pointerleave", () => deactivate(callout))
      callout.addEventListener("focusin", () => activate(callout))
      callout.addEventListener("focusout", () => deactivate(callout))
    })
  }

  document.addEventListener("nav", initialize)
  document.addEventListener("render", initialize)

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true })
  } else {
    initialize()
  }
}
