const EXPERIENCE_AUDIO_URL = "/audio/bim-short.mp3"
const LEVEL_UP_AUDIO_URL = "/audio/thunder.mp3"

type ExperienceAudioWindow = Window & {
  __wolkeExperienceAudioInitialized?: boolean
}

const experienceWindow = window as ExperienceAudioWindow
if (!experienceWindow.__wolkeExperienceAudioInitialized) {
  experienceWindow.__wolkeExperienceAudioInitialized = true

  function play(src: string, volume: number): void {
    const audio = new Audio(src)
    audio.volume = volume
    void audio.play().catch(() => {})
  }

  window.addEventListener("wolke7000:exp-gained", () => play(EXPERIENCE_AUDIO_URL, 0.55))
  window.addEventListener("wolke7000:level-up", () => play(LEVEL_UP_AUDIO_URL, 0.8))
}
