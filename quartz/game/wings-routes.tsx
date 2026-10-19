import type { QuartzComponent, QuartzComponentConstructor } from "../components/types"

// @ts-expect-error - inline script imports are handled by Quartz's build loader
import routesScript from "./wings-routes.inline.ts"

const routesCss = `
.wolke-wings-routes {
  margin-top: 1rem;
  padding: 0.8rem;
  border: 1px solid var(--lightgray);
  border-radius: 0.5rem;
  background: var(--light);
  color: var(--darkgray);
}

.wolke-wings-routes-title {
  margin: 0 0 0.65rem;
  color: var(--dark);
  font-family: var(--headerFont);
  font-size: 0.85rem;
}

.wolke-wings-routes-empty {
  margin: 0;
  color: var(--gray);
  font-size: 0.75rem;
}

.wolke-wings-route {
  padding: 0.55rem 0;
  border-top: 1px solid var(--lightgray);
  font-size: 0.7rem;
}

.wolke-wings-route strong {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--secondary);
  overflow-wrap: anywhere;
}

.wolke-wings-route dl {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.15rem 0.5rem;
  margin: 0;
}

.wolke-wings-route dt {
  color: var(--gray);
}

.wolke-wings-route dd {
  margin: 0;
  color: var(--darkgray);
  text-align: right;
  overflow-wrap: anywhere;
}
`

const WingsRoutes: QuartzComponent = () => (
  <section class="wolke-wings-routes" data-wolke-wings-routes>
    <h3 class="wolke-wings-routes-title">Open Wings Routes</h3>
    <div data-wolke-wings-routes-list />
  </section>
)

WingsRoutes.displayName = "Wolke Wings Routes"
WingsRoutes.css = routesCss
WingsRoutes.afterDOMLoaded = routesScript

export default (() => WingsRoutes) satisfies QuartzComponentConstructor
