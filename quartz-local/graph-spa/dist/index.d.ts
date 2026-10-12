import type { QuartzComponentConstructor } from "@quartz-community/types"
import type { GraphOptions } from "@quartz-community/graph"

export type GraphSpaOptions = GraphOptions

declare const GraphSpa: QuartzComponentConstructor<GraphSpaOptions>

export { GraphSpa }
export type { GraphSpaOptions }