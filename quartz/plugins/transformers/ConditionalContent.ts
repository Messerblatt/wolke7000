import remarkDirective from "remark-directive"
import { visit } from "unist-util-visit"
import type { Node } from "unist"
import type { QuartzTransformerPlugin } from "../types"

type ConditionDefinition = {
  runtimeType: string
  valueAttribute: string
  levelAttribute?: string
}

const conditionDefinitions: Record<string, ConditionDefinition> = {
  "requires-item": { runtimeType: "requires-item", valueAttribute: "item" },
  "unless-item": { runtimeType: "unless-item", valueAttribute: "item" },
  "requires-discovery": { runtimeType: "requires-discovery", valueAttribute: "id" },
  requires: { runtimeType: "requires-clan", valueAttribute: "clan", levelAttribute: "level" },
}

/**
 * remark-directive separates attributes with whitespace, not commas. Accept a
 * comma as a friendly authoring convention before remark parses the document,
 * so both `{clan="kreuzberg" level="3"}` and `{clan="kreuzberg", level="3"}`
 * produce the same directive AST. Also accept `={...}`, which is a common
 * authoring form even though remark-directive expects `{...}`.
 */
function normalizeDirectiveAttributes(source: string): string {
  return source.replace(
    /(^|\r?\n)([ \t]*:::([A-Za-z][\w-]*)(?:=)?\{)([^}\r\n]*)(\})/g,
    (
      match: string,
      lineStart: string,
      opening: string,
      type: string,
      attributes: string,
      closing: string,
    ) => {
      if (!conditionDefinitions[type]) return match
      return `${lineStart}${opening.replace(/=\{$/, "{")}${attributes.replace(/,\s*(?=[A-Za-z][\w-]*\s*=)/g, " ")}${closing}`
    },
  )
}

type DirectiveNode = {
  type: "containerDirective"
  name?: string
  attributes?: Record<string, string | null | undefined>
  data?: Record<string, unknown>
}

function conditionalPlugin() {
  return (tree: Node, file: { path?: string }) => {
    visit(tree, "containerDirective", (value) => {
      const node = value as DirectiveNode
      const type = node.name ?? ""
      const definition = conditionDefinitions[type]
      const attributeValue = definition
        ? node.attributes?.[definition.valueAttribute]?.trim()
        : undefined
      const levelValue = definition?.levelAttribute
        ? node.attributes?.[definition.levelAttribute]?.trim()
        : undefined
      const validLevel =
        !definition?.levelAttribute ||
        Boolean(
          levelValue && /^[1-9]\d*$/.test(levelValue) && Number.isSafeInteger(Number(levelValue)),
        )
      const valid = Boolean(definition && attributeValue && validLevel)

      if (!valid) {
        const location = file.path ? ` in ${file.path}` : ""
        const reason = !definition
          ? `unknown condition type "${type || "(empty)"}"`
          : !attributeValue
            ? `missing required attribute "${definition.valueAttribute}"`
            : `attribute "${definition.levelAttribute}" must be a positive integer`
        console.warn(`[ConditionalContent] ${reason}${location}; content will stay hidden.`)
      }

      const block = node as unknown as {
        type: "blockquote"
        data?: Record<string, unknown>
      }
      block.type = "blockquote"
      block.data = {
        ...node.data,
        hName: "div",
        hProperties: {
          className: ["wolke-conditional"],
          "data-condition-type": valid ? definition!.runtimeType : "unknown",
          "data-condition-value": valid ? attributeValue!.trim() : "",
          "data-condition-level": valid && levelValue ? levelValue : "",
          hidden: true,
        },
      }
    })
  }
}

const ConditionalContent: QuartzTransformerPlugin = () => ({
  name: "ConditionalContent",
  textTransform: (_ctx, source) => normalizeDirectiveAttributes(source),
  markdownPlugins() {
    return [remarkDirective, conditionalPlugin]
  },
})

export default ConditionalContent
