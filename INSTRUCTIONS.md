Implement a reusable rain-effect system for the Wolke 7000 Quartz website.

Context:
- The website is built with Quartz 5.
- It already has a browser-side Wolke Runtime.
- The goal is atmospheric rain falling across the viewport to make locations feel more alive.
- This is not “rain on glass” yet. For this sprint, implement visible falling raindrops moving diagonally across the screen.
- Keep it lightweight and framework-free. Prefer plain DOM + CSS.
- The effect must work correctly with Quartz SPA navigation and must not create duplicate intervals/listeners.
Desired architecture:
Wolke Runtime
     ↓
Weather / Ambient Effects
     ↓
Rain Controller
     ↓
persistent DOM overlay
     ↓
dynamically spawned raindrops

Create a small API such as:
wolke.weather.startRain({
  intensity: 0.6,
  wind: -0.3,
})

wolke.weather.stopRain()

intensity should be normalized roughly from 0 to 1.

wind should control horizontal drift. Negative values mean rain drifting left, positive values right.

The implementation should be modular and not hardcoded to one specific page.

Suggested structure:
wolke-runtime/
  weather/
    rain.ts
    weather.ts
    weather.scss

Adapt paths to the existing project structure.

Requirements:
1. Create one persistent rain root, mounted only once:
<div id="wolke-rain"></div>

It should be created programmatically if it does not already exist.

Do not create a second root when Quartz navigates between pages.
2. The overlay should cover the viewport:
#wolke-rain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

3. Raindrops should be lightweight DOM elements:
<div class="wolke-raindrop"></div>

They should spawn above the viewport and animate downward.
4. Base raindrop styling should use a narrow vertical gradient:
.wolke-raindrop {
  position: absolute;
  top: -10vh;
  width: 1px;
  height: 60px;

  background: linear-gradient(
    to bottom,
    transparent,
    rgba(220, 235, 255, 0.55)
  );

  animation-name: wolke-rain-fall;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

5. Use CSS custom properties for horizontal wind drift.
Example:
.wolke-raindrop {
  --rain-drift: -12vw;
}

@keyframes wolke-rain-fall {
  from {
    transform:
      translate3d(0, -10vh, 0)
      rotate(10deg);
  }

  to {
    transform:
      translate3d(
        var(--rain-drift),
        120vh,
        0
      )
      rotate(10deg);
  }
}

6. Raindrops should vary randomly in:
   - horizontal start position
   - length
   - opacity
   - width
   - fall duration
   - wind drift
Use two rough depth classes:

Far rain:
thin
faint
short
slower

Near rain:
thicker
brighter
longer
faster

This is important so the effect does not look like identical CSS lines.
7. Example spawn logic:
function spawnRaindrop() {
  const root = ensureRainRoot()
  const drop = document.createElement("div")

  drop.className = "wolke-raindrop"

  const depth = Math.random()

  drop.style.left = `${Math.random() * 100}vw`

  if (depth < 0.6) {
    drop.style.width = "1px"
    drop.style.height = `${20 + Math.random() * 40}px`
    drop.style.opacity = `${0.1 + Math.random() * 0.2}`
    drop.style.animationDuration =
      `${900 + Math.random() * 700}ms`
  } else {
    drop.style.width = "2px"
    drop.style.height = `${60 + Math.random() * 100}px`
    drop.style.opacity = `${0.35 + Math.random() * 0.35}`
    drop.style.animationDuration =
      `${400 + Math.random() * 400}ms`
  }

  root.appendChild(drop)

  drop.addEventListener(
    "animationend",
    () => drop.remove(),
    { once: true }
  )
}

Adapt this rather than copying blindly if the existing codebase has better conventions.
8. startRain() must not create duplicate spawn timers.
Calling:
startRain()
startRain()
startRain()

must still result in only one active rain loop.
9. stopRain() should:
   - stop spawning new drops
   - optionally allow existing drops to finish naturally
   - expose a clean state so rain can be restarted later
10. Intensity should determine spawn frequency.
Example concept:
const delay =
  maxDelay - intensity * intensityRange

Rough behavior:
0.2 → drizzle
0.5 → normal rain
0.9 → storm

Do not spawn an absurd number of DOM elements.

Keep performance in mind.
11. Wind should affect each drop with slight random variation.
Example:
const drift =
  baseWind +
  randomVariation

Then:
drop.style.setProperty(
  "--rain-drift",
  `${drift}vw`
)

12. Add a small controller object, roughly:
type RainOptions = {
  intensity?: number
  wind?: number
}

class RainController {
  start(options?: RainOptions): void
  stop(): void
  setIntensity(value: number): void
  setWind(value: number): void
  isActive(): boolean
}

Expose it through the Wolke Runtime rather than as random globals.

Preferred API:
wolke.weather.rain.start(...)
wolke.weather.rain.stop()

or:
wolke.weather.startRain(...)
wolke.weather.stopRain()

Choose whichever fits the existing runtime architecture better.
13. Quartz SPA compatibility:
    - inspect how the existing project handles the Quartz nav event
    - do not re-register duplicate listeners on every navigation
    - the rain root should remain stable
    - weather state should survive page navigation unless the game logic explicitly changes it
14. Prepare for location-driven weather, but do not overbuild it.
The weather API should make this possible later:
if (locationId === "tempelhofer-diskoord") {
  wolke.weather.startRain({
    intensity: 0.35,
    wind: -0.2,
  })
}

and:
if (locationId === "teufelsberg") {
  wolke.weather.startRain({
    intensity: 0.8,
    wind: -0.7,
  })
}

Do not hardcode those location rules into the rain renderer itself.
15. Think carefully about z-index.
Preferred visual stack:
background
↓
rain
↓
main content / cards / dialogue

The rain should usually look like it is part of the world behind the readable interface, not like scratches placed directly over all text.

If the current Quartz layout makes that difficult, document the stacking-context issue before forcing a brittle z-index hack.
16. Respect reduced-motion settings.
Add:
@media (prefers-reduced-motion: reduce) {
  #wolke-rain {
    display: none;
  }
}

or an equivalent runtime check.
17. No canvas or WebGL in this sprint.
Plain DOM + CSS only.
18. Do not implement rain-on-glass droplets, collisions, splashes, sound, lightning, puddles, or particle pooling yet.
Keep this sprint limited to:
falling rain
variable depth
variable wind
controllable intensity
clean start/stop API
Quartz SPA compatibility

19. Add a temporary development trigger or debug method so I can test:
wolke.weather.startRain({
  intensity: 0.7,
  wind: -0.4,
})

and:
wolke.weather.stopRain()

directly from the browser console or an existing debug interface.
20. Before implementing, inspect:
    - the current Wolke Runtime structure
    - where global client-side scripts are mounted
    - existing Quartz SPA navigation handling
    - existing CSS/z-index structure
    - whether a persistent runtime root already exists
First report:
- which files you intend to create/change
- where the rain root will live
- how the timer lifecycle will work
- how this integrates with the existing runtime


ONE IMPORTAN THING: don’t attach rain initialization to every page’s component render. Weather is global runtime state, not page content.

