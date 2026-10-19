import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

import { componentRegistry } from "./quartz/components/registry"
import GameRuntime from "./quartz/game/component"
import Inventory from "./quartz/game/inventory"
import Volier from "./quartz/game/volier"
import Experience from "./quartz/game/experience"
import WingsRoutes from "./quartz/game/wings-routes"

// Registering the runtime here makes it part of Quartz's global component
// resources without adding an invisible layout element to every page.
componentRegistry.register("wolke-game-runtime", GameRuntime, "local")
componentRegistry.register("wolke-inventory", Inventory, "local", {
  name: "wolke-inventory",
  displayName: "Wolke Inventory",
  description: "Displays the player's items and letters.",
  version: "1.0.0",
  defaultPosition: "left",
  defaultPriority: 30,
})
componentRegistry.register("wolke-volier", Volier, "local", {
  name: "wolke-volier",
  displayName: "Wolke Volier",
  description: "Displays and manages available wings.",
  version: "1.0.0",
  defaultPosition: "right",
  defaultPriority: 55,
})
componentRegistry.register("wolke-experience", Experience, "local", {
  name: "wolke-experience",
  displayName: "Wolke Experience",
  description: "Displays player experience progress.",
  version: "1.0.0",
  defaultPosition: "right",
  defaultPriority: 40,
})
componentRegistry.register("wolke-wings-routes", WingsRoutes, "local", {
  name: "wolke-wings-routes",
  displayName: "Wolke Wings Routes",
  description: "Tracks Open Wings routes.",
  version: "1.0.0",
  defaultPosition: "right",
  defaultPriority: 45,
})

const config = await loadQuartzConfig()

export default config

export const layout = await loadQuartzLayout()
