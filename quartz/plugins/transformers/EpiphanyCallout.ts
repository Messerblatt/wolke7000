import remarkDirective from "remark-directive"
import { visit } from "unist-util-visit"
import type { Node } from "unist"
import type { QuartzTransformerPlugin } from "../types"

type DirectiveNode = {
  type: "containerDirective"
  name?: string
  data?: Record<string, unknown>
}

function epiphanyPlugin() {
  return (tree: Node) => {
    visit(tree, "containerDirective", (value) => {
      const node = value as DirectiveNode
      if (node.name !== "epiphany") return

      const block = node as unknown as {
        type: "blockquote"
        data?: Record<string, unknown>
      }
      block.type = "blockquote"
      block.data = {
        ...node.data,
        hName: "div",
        hProperties: {
          className: ["callout", "wolke-epiphany-callout"],
          "data-callout": "abstract",
        },
      }
    })
  }
}

const EpiphanyCallout: QuartzTransformerPlugin = () => ({
  name: "EpiphanyCallout",
  markdownPlugins() {
    return [remarkDirective, epiphanyPlugin]
  },
})

export default EpiphanyCallout
