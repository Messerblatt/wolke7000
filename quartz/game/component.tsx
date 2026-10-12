import type { QuartzComponent, QuartzComponentConstructor } from "../components/types"

// @ts-expect-error - inline script imports are handled by Quartz's build loader
import gameScript from "./browser.inline.ts"

/** Global, invisible component that installs the shared browser game runtime. */
const GameRuntime: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = () => null
  Component.displayName = "Wolke Game Runtime"
  Component.css = `
    pre.wolke-drop-target {
      border-color: #d4af37 !important;
    }
  `
  Component.afterDOMLoaded = gameScript
  return Component
}

export default GameRuntime
