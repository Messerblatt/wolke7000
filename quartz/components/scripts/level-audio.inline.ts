const HOAH_URL = "/audio/thunder.mp3"

window.addEventListener("wolke7000:level-up", () => {
  if (window.__wolkeAudio) {
    window.__wolkeAudio.play(HOAH_URL)
    return
  }
  const hoah = new Audio(HOAH_URL)
  void hoah.play().catch(() => {})
})
