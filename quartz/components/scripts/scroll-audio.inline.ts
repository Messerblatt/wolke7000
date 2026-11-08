const SCROLL_CLICK_URL = "/audio/bim-short.mp3"
const configuredClickFrequency = Number(document.documentElement.dataset.wolkeScrollClickFrequency)
const scrollClickFrequency =
  Number.isInteger(configuredClickFrequency) && configuredClickFrequency > 0
    ? configuredClickFrequency
    : 5
const configuredExpFrequency = Number(document.documentElement.dataset.wolkeScrollExp)
const scrollExpFrequency =
  Number.isInteger(configuredExpFrequency) && configuredExpFrequency > 0
    ? configuredExpFrequency
    : 100

let scrollEventCount = 0
let upwardScrollEventCount = 0
let previousScrollY = window.scrollY
let trackingReady = false
let lastWheelDirection: "up" | "down" | null = null

function playScrollClick(): void {
  if (!trackingReady) return

  const currentScrollY = window.scrollY
  const wheelDirection = lastWheelDirection
  lastWheelDirection = null
  const scrollingUp = currentScrollY < previousScrollY && wheelDirection !== "down"
  previousScrollY = currentScrollY
  if (!scrollingUp) return

  scrollEventCount += 1
  if (scrollEventCount % scrollClickFrequency === 0) {
    const click = new Audio(SCROLL_CLICK_URL)
    void click.play().catch(() => {})
  }

  upwardScrollEventCount += 1
  if (upwardScrollEventCount % scrollExpFrequency === 0) {
    window.dispatchEvent(new CustomEvent("wolke7000:exp"))
  }
}

document.addEventListener("prenav", () => {
  trackingReady = false
  previousScrollY = window.scrollY
  lastWheelDirection = null
})
document.addEventListener("nav", () => {
  previousScrollY = window.scrollY
  trackingReady = true
})
window.addEventListener(
  "wheel",
  (event) => {
    lastWheelDirection = event.deltaY < 0 ? "up" : "down"
  },
  { passive: true },
)
window.addEventListener("scroll", playScrollClick, { passive: true })
