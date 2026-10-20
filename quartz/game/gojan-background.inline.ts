const pageSelector = 'body[data-slug="characters/gojan"]'
const videoId = "wolke-gojan-background"
const videoSource = "/imgs/characters/gojan/new-frozenbubblessmooth-anim-2k-cc.mp4"

type GojanWindow = Window & {
  __wolkeGojanBackgroundInitialized?: boolean
}

const gojanWindow = window as GojanWindow
if (!gojanWindow.__wolkeGojanBackgroundInitialized) {
  gojanWindow.__wolkeGojanBackgroundInitialized = true

  const video =
    (document.getElementById(videoId) as HTMLVideoElement | null) ?? document.createElement("video")
  video.id = videoId
  video.src = videoSource
  video.muted = true
  video.loop = true
  video.autoplay = true
  video.playsInline = true
  video.preload = "auto"
  video.setAttribute("aria-hidden", "true")
  video.setAttribute("data-persist", "")

  if (video.parentElement !== document.documentElement) {
    document.documentElement.appendChild(video)
  }

  function refresh(): void {
    const active = document.body.matches(pageSelector)
    video.classList.toggle("is-active", active)

    if (active) {
      void video.play().catch(() => {})
    } else {
      video.pause()
      video.currentTime = 0
    }
  }

  document.addEventListener("nav", refresh)
  document.addEventListener("render", refresh)

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh, { once: true })
  } else {
    refresh()
  }
}
