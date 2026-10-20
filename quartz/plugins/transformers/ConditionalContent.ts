import remarkDirective from "remark-directive"
import { visit } from "unist-util-visit"
import type { Node } from "unist"
import type { QuartzTransformerPlugin } from "../types"

type ConditionDefinition = {
  runtimeType: string
  valueAttribute?: string
  levelAttribute?: string
  quantityAttribute?: string
}

const conditionDefinitions: Record<string, ConditionDefinition> = {
  "requires-item": {
    runtimeType: "requires-item",
    valueAttribute: "item",
    quantityAttribute: "quantity",
  },
  "unless-item": { runtimeType: "unless-item", valueAttribute: "item" },
  "requires-discovery": { runtimeType: "requires-discovery", valueAttribute: "id" },
  requires: { runtimeType: "requires-clan", valueAttribute: "clan", levelAttribute: "level" },
  "requires-level": { runtimeType: "requires-level", levelAttribute: "level" },
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
      let normalizedAttributes = attributes.replace(/,\s*(?=[A-Za-z][\w-]*\s*=)/g, " ")
      if (conditionDefinitions[type]?.quantityAttribute) {
        normalizedAttributes = normalizedAttributes.replace(/,\s*([1-9]\d*)\s*$/, ' quantity="$1"')
      }
      return `${lineStart}${opening.replace(/=\{$/, "{")}${normalizedAttributes}${closing}`
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
      if (!definition) return
      const attributeValue = definition
        ? definition.valueAttribute
          ? node.attributes?.[definition.valueAttribute]?.trim()
          : undefined
        : undefined
      const levelValue = definition?.levelAttribute
        ? node.attributes?.[definition.levelAttribute]?.trim()
        : undefined
      const quantityValue = definition?.quantityAttribute
        ? node.attributes?.[definition.quantityAttribute]?.trim()
        : undefined
      const validLevel =
        !definition?.levelAttribute ||
        Boolean(
          levelValue && /^[1-9]\d*$/.test(levelValue) && Number.isSafeInteger(Number(levelValue)),
        )
      const validQuantity =
        !definition?.quantityAttribute ||
        Boolean(
          !quantityValue ||
          (/^[1-9]\d*$/.test(quantityValue) && Number.isSafeInteger(Number(quantityValue))),
        )
      const valid = Boolean(
        definition && (!definition.valueAttribute || attributeValue) && validLevel && validQuantity,
      )

      if (!valid) {
        const location = file.path ? ` in ${file.path}` : ""
        const reason =
          definition.valueAttribute && !attributeValue
            ? `missing required attribute "${definition.valueAttribute}"`
            : !validLevel
              ? `attribute "${definition.levelAttribute}" must be a positive integer`
              : `attribute "${definition.quantityAttribute}" must be a positive integer`
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
          "data-condition-value": valid && attributeValue ? attributeValue.trim() : "",
          "data-condition-level": valid && levelValue ? levelValue : "",
          "data-condition-quantity": valid && quantityValue ? quantityValue : "",
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
