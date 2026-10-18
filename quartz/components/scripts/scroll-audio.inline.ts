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

function playScrollClick() {
  scrollEventCount += 1
  if (scrollEventCount % scrollClickFrequency === 0) {
    if (window.__wolkeAudio) {
      window.__wolkeAudio.play(SCROLL_CLICK_URL)
    } else {
      const click = new Audio(SCROLL_CLICK_URL)
      void click.play().catch(() => {})
    }
  }

  if (scrollEventCount % scrollExpFrequency === 0) {
    window.dispatchEvent(new CustomEvent("wolke7000:exp"))
  }
}

window.addEventListener("scroll", playScrollClick, { passive: true })
