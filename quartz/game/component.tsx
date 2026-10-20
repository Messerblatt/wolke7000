import type { QuartzComponent, QuartzComponentConstructor } from "../components/types"

// @ts-expect-error - inline script imports are handled by Quartz's build loader
import gameScript from "./runtime/browser.inline.ts"
// @ts-expect-error - inline script imports are handled by Quartz's build loader
import conditionsScript from "./conditions.inline.ts"
// @ts-expect-error - inline script imports are handled by Quartz's build loader
import kokoloresCalloutsScript from "./kokolores-callouts.inline.ts"
// @ts-expect-error - inline script imports are handled by Quartz's build loader
import fiboCalloutsScript from "./fibo-callouts.inline.ts"
// @ts-expect-error - inline script imports are handled by Quartz's build loader
import gojanBackgroundScript from "./gojan-background.inline.ts"
// @ts-expect-error - inline script imports are handled by Quartz's build loader
import fallenAngelIntroScript from "./fallen-angel-intro.inline.ts"
// @ts-expect-error - inline script imports are handled by Quartz's build loader
import riseAmbientScript from "./rise-ambient.inline.ts"
// @ts-expect-error - inline script imports are handled by Quartz's build loader
import weatherScript from "./weather/bootstrap.inline.ts"

/** Global, invisible component that installs the shared browser game runtime. */
const GameRuntime: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = () => null
  Component.displayName = "Wolke Game Runtime"
  Component.afterDOMLoaded = [
    gameScript,
    conditionsScript,
    kokoloresCalloutsScript,
    fiboCalloutsScript,
    gojanBackgroundScript,
    fallenAngelIntroScript,
    riseAmbientScript,
    weatherScript,
  ]
  return Component
}

export default GameRuntime
