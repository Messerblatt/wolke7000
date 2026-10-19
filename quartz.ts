import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

import { componentRegistry } from "./quartz/components/registry"
import GameRuntime from "./quartz/game/component"
import Experience from "./quartz/game/experience"
import WingsRoutes from "./quartz/game/wings-routes"
import Volier from "./quartz/game/volier"
import Inventory from "./quartz/game/inventory"

// Registering the runtime here makes it part of Quartz's global component
// resources without adding an invisible layout element to every page.
componentRegistry.register("wolke-game-runtime", GameRuntime, "local")
componentRegistry.register("wolke-experience", Experience, "local", {
  name: "wolke-experience",
  displayName: "Wolke Experience",
  description: "Displays the player's experience progress and level.",
  version: "1.0.0",
  defaultPosition: "right",
  defaultPriority: 40,
})
componentRegistry.register("wolke-wings-routes", WingsRoutes, "local", {
  name: "wolke-wings-routes",
  displayName: "Wolke Wings Routes",
  description: "Tracks Open Wings delivery messages.",
  version: "1.0.0",
  defaultPosition: "right",
  defaultPriority: 45,
})
componentRegistry.register("wolke-volier", Volier, "local", {
  name: "wolke-volier",
  displayName: "Wolke Volier",
  description: "Displays and manages available Open Wings pigeons.",
  version: "1.0.0",
  defaultPosition: "right",
  defaultPriority: 55,
})
componentRegistry.register("wolke-inventory", Inventory, "local", {
  name: "wolke-inventory",
  displayName: "Wolke Inventory",
  description: "Displays items and letters.",
  version: "1.0.0",
  defaultPosition: "right",
  defaultPriority: 50,
})

const config = await loadQuartzConfig()

export default config

export const layout = await loadQuartzLayout()
