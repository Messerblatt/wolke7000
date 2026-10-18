import type { QuartzComponent, QuartzComponentConstructor } from "../components/types"

// @ts-expect-error - inline script imports are handled by Quartz's build loader
import gameScript from "./browser.inline.ts"
// @ts-expect-error - inline script imports are handled by Quartz's build loader
import conditionsScript from "./conditions.inline.ts"

/** Global, invisible component that installs the shared browser game runtime. */
const GameRuntime: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = () => null
  Component.displayName = "Wolke Game Runtime"
  Component.afterDOMLoaded = [gameScript, conditionsScript]
  return Component
}

export default GameRuntime
