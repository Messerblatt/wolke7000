import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { unified } from "unified"
import remarkParse from "remark-parse"
import EpiphanyCallout from "./EpiphanyCallout"

describe("epiphany callout transformer", () => {
  test("turns an epiphany directive into an independent callout", () => {
    const plugin = EpiphanyCallout()
    const processor = unified()
      .use(remarkParse)
      .use(plugin.markdownPlugins!({} as never))
    const tree = processor.runSync(
      processor.parse(":::epiphany\n![[compass.png]]\n:::"),
    ) as unknown as {
      children: Array<{ data?: { hProperties?: Record<string, unknown> } }>
    }
    const properties = tree.children[0]?.data?.hProperties

    assert.deepEqual(properties?.className, ["callout", "wolke-epiphany-callout"])
    assert.equal(properties?.["data-callout"], "abstract")
  })
})
