const HUMM_URL = "/audio/humm2.mp3"

window.addEventListener("wolke7000:item-picked-up", () => {
  if (window.__wolkeAudio) {
    window.__wolkeAudio.play(HUMM_URL)
    return
  }
  const humm = new Audio(HUMM_URL)
  void humm.play().catch(() => {})
})
