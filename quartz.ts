import {
  loadQuartzConfig,
  loadQuartzLayout,
} from "./quartz/plugins/loader/config-loader"

import { componentRegistry } from "./quartz/components/registry"
// import Inventory from "./quartz/components/Inventory"

/*componentRegistry.register(
  "inventory",
  Inventory,
  "local",
)*/

const config = await loadQuartzConfig()

export default config

export const layout = await loadQuartzLayout()