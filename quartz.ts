import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

import { componentRegistry } from "./quartz/components/registry"
import GameRuntime from "./quartz/game/component"

// Registering the runtime here makes it part of Quartz's global component
// resources without adding an invisible layout element to every page.
componentRegistry.register("wolke-game-runtime", GameRuntime, "local")

const config = await loadQuartzConfig()

export default config

export const layout = await loadQuartzLayout()
