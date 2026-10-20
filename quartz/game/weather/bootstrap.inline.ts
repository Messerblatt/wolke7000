import { getWolke } from "../runtime/browser"

// getWolke() owns the singleton. This script is safe if Quartz re-executes
// component resources while navigating or during a development rebuild.
getWolke()
