import {
  loadQuartzConfig,
  loadQuartzLayout,
} from "./quartz/plugins/loader/config-loader"

import { componentRegistry } from "./quartz/components/registry"
import { registerCondition } from "./quartz/plugins/loader/conditions"
// import Inventory from "./quartz/components/Inventory"

/*componentRegistry.register(
  "inventory",
  Inventory,
  "local",
)*/

/**
 * `show-graph` controls whether the graph explorer renders on a page.
 *
 * Note the polarity: Quartz treats a `condition` as "render when true", so
 * this predicate is the inverse of the `graphLocked` frontmatter flag. A page
 * shows the explorer by default; only pages carrying `graphLocked: true` opt
 * out.
 *
 * That inversion is deliberate. The locked state is a temporary editorial
 * condition on the handful of pages that introduce the reader to the site, so
 * unlocking means *removing* the flag from those few pages - not stripping it
 * from every page in the vault.
 *
 * Nothing here knows about the rucksack or about navigation: the unlock is a
 * content decision, so the dependency runs one way only (content -> layout).
 */
registerCondition(
  "show-graph",
  (props) => props.fileData.frontmatter?.graphLocked !== true,
)

const config = await loadQuartzConfig()

export default config

export const layout = await loadQuartzLayout()