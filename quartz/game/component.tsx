import type { QuartzComponent, QuartzComponentConstructor } from "../components/types"
import gameScript from "./runtime/browser.inline.ts"
// import conditionsScript from "./conditions.inline.ts"


/** Global, invisible component that installs the shared browser game runtime. */
const GameRuntime: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = () => null
  Component.displayName = "Wolke Game Runtime"
  Component.afterDOMLoaded = [
    gameScript,
   // conditionsScript,
  ]
  return Component
}

export default GameRuntime
