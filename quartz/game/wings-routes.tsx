import type { QuartzComponent, QuartzComponentConstructor } from "../components/types"

// @ts-expect-error - inline script imports are handled by Quartz's build loader
import routesScript from "./wings-routes.inline.ts"

const WingsRoutes: QuartzComponent = () => (
  <section class="wolke-wings-routes" data-wolke-wings-routes>
    <h3>Open Wings Routes</h3>
    <div data-wolke-wings-routes-list />
  </section>
)

WingsRoutes.displayName = "Wolke Wings Routes"
WingsRoutes.css = `
.wolke-wings-routes { margin: 1rem 0; padding: .8rem; border: 1px solid var(--lightgray); border-radius: .5rem; background: var(--light); color: var(--darkgray); font-size: .75rem; }
.wolke-wings-routes h3 { margin: 0 0 .6rem; color: var(--dark); font-family: var(--headerFont); font-size: .85rem; }
`
WingsRoutes.afterDOMLoaded = routesScript

export default (() => WingsRoutes) satisfies QuartzComponentConstructor
