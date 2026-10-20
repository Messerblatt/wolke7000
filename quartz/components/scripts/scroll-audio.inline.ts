const SCROLL_CLICK_URL = "/audio/bim-short.mp3"
const configuredFrequency = Number(document.documentElement.dataset.wolkeScrollClickFrequency)
const scrollClickFrequency =
  Number.isInteger(configuredFrequency) && configuredFrequency > 0 ? configuredFrequency : 5
const configuredExpFrequency = Number(document.documentElement.dataset.wolkeScrollExp)
const scrollExpFrequency =
  Number.isInteger(configuredExpFrequency) && configuredExpFrequency > 0
    ? configuredExpFrequency
    : 100
let scrollEventCount = 0
let upwardScrollEventCount = 0
let previousScrollY = window.scrollY
let scrollTrackingReady = false
let lastWheelDirection: "up" | "down" | null = null

function playScrollClick() {
  const currentScrollY = window.scrollY
  const wheelDirection = lastWheelDirection
  lastWheelDirection = null
  const scrollingUp = currentScrollY < previousScrollY && wheelDirection !== "down"
  previousScrollY = currentScrollY

  if (!scrollTrackingReady || !scrollingUp) return

  scrollEventCount += 1
  if (scrollEventCount % scrollClickFrequency === 0) {
    if (window.__wolkeAudio) {
      window.__wolkeAudio.play(SCROLL_CLICK_URL)
    } else {
      const click = new Audio(SCROLL_CLICK_URL)
      void click.play().catch(() => {})
    }
  }

  upwardScrollEventCount += 1
  if (upwardScrollEventCount % scrollExpFrequency === 0) {
    window.dispatchEvent(new CustomEvent("wolke7000:exp"))
  }
}

document.addEventListener("prenav", () => {
  scrollTrackingReady = false
  previousScrollY = window.scrollY
  lastWheelDirection = null
})
document.addEventListener("nav", () => {
  previousScrollY = window.scrollY
  scrollTrackingReady = true
})
window.addEventListener(
  "wheel",
  (event) => {
    lastWheelDirection = event.deltaY < 0 ? "up" : "down"
  },
  { passive: true },
)
window.addEventListener("scroll", playScrollClick, { passive: true })
