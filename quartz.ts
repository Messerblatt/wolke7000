import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

import { componentRegistry } from "./quartz/components/registry"
import GameRuntime from "./quartz/game/component"
import Experience from "./quartz/game/experience"
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
