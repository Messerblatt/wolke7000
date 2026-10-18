const SCRUNCH_URL = "/audio/scrunch.mp3"
const WHOOP_URL = "/audio/whoop.mp3"

function playScrunch() {
  if (window.__wolkeAudio) {
    window.__wolkeAudio.play(SCRUNCH_URL)
    return
  }
  const scrunch = new Audio(SCRUNCH_URL)
  void scrunch.play().catch(() => {})
}

function playWhoop() {
  if (window.__wolkeAudio) {
    window.__wolkeAudio.play(WHOOP_URL)
    return
  }
  const whoop = new Audio(WHOOP_URL)
  void whoop.play().catch(() => {})
}

function visitsAnotherPage(event: Event): boolean {
  const target = event.target
  if (!(target instanceof Element)) return false

  const link = target.closest<HTMLAnchorElement>("a[href]")
  if (!link || link.hasAttribute("download")) return false

  let url: URL
  try {
    url = new URL(link.href, window.location.href)
  } catch {
    return false
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false

  return (
    url.origin !== window.location.origin ||
    url.pathname !== window.location.pathname ||
    url.search !== window.location.search
  )
}

document.addEventListener(
  "click",
  (event) => {
    if (visitsAnotherPage(event)) playScrunch()
  },
  true,
)

window.addEventListener("wolke7000:graph-navigate", playWhoop)
