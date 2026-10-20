const pageSelector = 'body[data-slug="the-fallen-angel"]'
const videoId = "wolke-fallen-angel-video"
const shesheId = "wolke-fallen-angel-sheshe"
const fadeId = "wolke-fallen-angel-fade"
const videoSource = "/imgs/characters/gojan/new-frozenbubblessmooth-anim-2k-cc.mp4"
const shesheSource = "/imgs/characters/kokolores/sheshe-2.jpg"

type IntroWindow = Window & {
  __wolkeFallenAngelIntroInitialized?: boolean
}

const introWindow = window as IntroWindow
if (!introWindow.__wolkeFallenAngelIntroInitialized) {
  introWindow.__wolkeFallenAngelIntroInitialized = true

  const video =
    (document.getElementById(videoId) as HTMLVideoElement | null) ?? document.createElement("video")
  const sheshe =
    (document.getElementById(shesheId) as HTMLImageElement | null) ?? document.createElement("img")
  const fade = document.getElementById(fadeId) ?? document.createElement("div")

  video.id = videoId
  video.src = videoSource
  video.muted = true
  video.autoplay = true
  video.loop = false
  video.playsInline = true
  video.preload = "auto"
  video.setAttribute("aria-hidden", "true")
  video.setAttribute("data-persist", "")

  sheshe.id = shesheId
  sheshe.src = shesheSource
  sheshe.alt = ""
  sheshe.setAttribute("aria-hidden", "true")
  sheshe.setAttribute("data-persist", "")

  fade.id = fadeId
  fade.setAttribute("aria-hidden", "true")
  fade.setAttribute("data-persist", "")

  for (const element of [video, sheshe, fade]) {
    if (element.parentElement !== document.documentElement) {
      document.documentElement.appendChild(element)
    }
  }

  function reset(): void {
    video.pause()
    video.currentTime = 0
    sheshe.classList.remove("is-revealed")
    fade.classList.remove("is-fading")
  }

  function revealEpiphany(): void {
    sheshe.classList.add("is-revealed")
    fade.classList.add("is-fading")
  }

  function refresh(): void {
    const active = document.body.matches(pageSelector)
    document.documentElement.classList.toggle("fallen-angel-immersive", active)

    if (!active) {
      reset()
      return
    }

    reset()
    void video.play().catch(() => {})
  }

  video.addEventListener("ended", () => {
    if (document.body.matches(pageSelector)) revealEpiphany()
  })
  document.addEventListener("nav", refresh)

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh, { once: true })
  } else {
    refresh()
  }
}
