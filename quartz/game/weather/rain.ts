export type RainOptions = {
  /** A normalized value from 0 (off) to 1 (storm). */
  intensity?: number
  /** A normalized horizontal drift from -1 (left) to 1 (right). */
  wind?: number
}

const DEFAULT_INTENSITY = 4
const DEFAULT_WIND = 3
const MAX_DROPS = 160
const MAX_DELAY = 100
const MIN_DELAY = 16
const WIND_SCALE = 50

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalized(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function ensureRainRoot(): HTMLDivElement {
  let root = document.getElementById("wolke-rain") as HTMLDivElement | null

  if (!root) {
    root = document.createElement("div")
    root.id = "wolke-rain"
  }

  // The body is replaced by Quartz during SPA navigation. Keep the overlay
  // on html so it survives that replacement, even if another script created
  // the root before this controller was initialized.
  if (root.parentElement !== document.documentElement) {
    document.documentElement.appendChild(root)
  }

  return root
}

export class RainController {
  #intensity = DEFAULT_INTENSITY
  #wind = DEFAULT_WIND
  #active = false
  #timer: number | null = null

  start(options: RainOptions = {}): void {
    if (options.intensity !== undefined) {
      this.#intensity = clamp(normalized(options.intensity, this.#intensity), 0, 1)
    }
    if (options.wind !== undefined) {
      this.#wind = clamp(normalized(options.wind, this.#wind), -1, 1)
    }

    const wasActive = this.#active
    this.#active = true
    ensureRainRoot()

    // Re-schedule rather than add another loop when start() is called again.
    this.clearTimer()
    if (!wasActive) this.spawnRaindrop()
    this.scheduleNext()
  }

  stop(): void {
    this.#active = false
    this.clearTimer()
    // Existing CSS animations are deliberately allowed to finish.
  }

  setIntensity(value: number): void {
    this.#intensity = clamp(normalized(value, this.#intensity), 0, 1)
    if (this.#active) {
      this.clearTimer()
      this.scheduleNext()
    }
  }

  setWind(value: number): void {
    this.#wind = clamp(normalized(value, this.#wind), -1, 1)
  }

  isActive(): boolean {
    return this.#active
  }

  private clearTimer(): void {
    if (this.#timer === null) return
    window.clearTimeout(this.#timer)
    this.#timer = null
  }

  private scheduleNext(): void {
    if (!this.#active || this.#intensity <= 0) return

    const delay = MAX_DELAY - this.#intensity * (MAX_DELAY - MIN_DELAY)
    this.#timer = window.setTimeout(() => {
      this.#timer = null
      if (!this.#active) return
      this.spawnRaindrop()
      this.scheduleNext()
    }, delay)
  }

  private spawnRaindrop(): void {
    if (this.#intensity <= 0 || prefersReducedMotion()) return

    const root = ensureRainRoot()
    const oldDrop = root.querySelector<HTMLElement>(".wolke-raindrop")
    if (root.childElementCount >= MAX_DROPS && oldDrop) oldDrop.remove()

    const drop = document.createElement("div")
    const depth = Math.random()
    const near = depth >= 0.6
    const variation = (Math.random() - 0.5) * 10
    const drift = this.#wind * WIND_SCALE + variation

    drop.className = `wolke-raindrop ${near ? "wolke-raindrop--near" : "wolke-raindrop--far"}`
    drop.style.left = `${Math.random() * 100}vw`
    drop.style.setProperty("--rain-drift", `${drift}vw`)

    if (near) {
      drop.style.width = `${1.5 + Math.random() * 0.75}px`
      drop.style.height = `${60 + Math.random() * 100}px`
      drop.style.opacity = `${0.35 + Math.random() * 0.35}`
      drop.style.animationDuration = `${400 + Math.random() * 400}ms`
    } else {
      drop.style.width = `${0.6 + Math.random() * 0.5}px`
      drop.style.height = `${20 + Math.random() * 40}px`
      drop.style.opacity = `${0.1 + Math.random() * 0.2}`
      drop.style.animationDuration = `${900 + Math.random() * 700}ms`
    }

    const remove = () => drop.remove()
    drop.addEventListener("animationend", remove, { once: true })
    drop.addEventListener("animationcancel", remove, { once: true })
    root.appendChild(drop)
  }
}
