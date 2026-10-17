import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { unified } from "unified"
import remarkParse from "remark-parse"
import ConditionalContent from "./ConditionalContent"

describe("conditional content transformer", () => {
  test("accepts comma-separated clan attributes", () => {
    const plugin = ConditionalContent()
    const source = plugin.textTransform!(
      undefined as never,
      ':::requires{clan="kreuzberg", level="3"}\nHallo\n:::',
    )
    const processor = unified().use(remarkParse).use(plugin.markdownPlugins!())
    const tree = processor.runSync(processor.parse(source)) as unknown as {
      children: Array<{ data?: { hProperties?: Record<string, unknown> } }>
    }
    const properties = tree.children[0]?.data?.hProperties

    assert.equal(properties?.["data-condition-type"], "requires-clan")
    assert.equal(properties?.["data-condition-value"], "kreuzberg")
    assert.equal(properties?.["data-condition-level"], "3")
  })

  test("accepts equals before directive attributes", () => {
    const plugin = ConditionalContent()
    const source = plugin.textTransform!(
      undefined as never,
      ':::requires-item={item="ignition-chamber, stabilizing-fin"}\nUnlocked\n:::',
    )
    const processor = unified().use(remarkParse).use(plugin.markdownPlugins!())
    const tree = processor.runSync(processor.parse(source)) as unknown as {
      children: Array<{ data?: { hProperties?: Record<string, unknown> } }>
    }
    const properties = tree.children[0]?.data?.hProperties

    assert.equal(properties?.["data-condition-type"], "requires-item")
    assert.equal(properties?.["data-condition-value"], "ignition-chamber, stabilizing-fin")
  })
})
