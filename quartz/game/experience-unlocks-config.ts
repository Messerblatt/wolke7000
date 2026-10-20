import { existsSync, readFileSync } from "fs"
import { resolve } from "path"
import { parse } from "yaml"

export type ExperienceUnlockConfig = {
  canvas: string
  levels: { level: number; nodes: string[] }[]
}

export function loadExperienceUnlockConfig(projectRoot = process.cwd()): ExperienceUnlockConfig {
  const path = resolve(projectRoot, "experience-unlocks.yaml")
  if (!existsSync(path)) return { canvas: "dreams.canvas", levels: [] }

  try {
    const parsed = parse(readFileSync(path, "utf8")) as Partial<ExperienceUnlockConfig>
    return {
      canvas: typeof parsed.canvas === "string" ? parsed.canvas : "dreams.canvas",
      levels: Array.isArray(parsed.levels)
        ? parsed.levels.filter(
            (entry): entry is { level: number; nodes: string[] } =>
              typeof entry === "object" &&
              entry !== null &&
              typeof entry.level === "number" &&
              Array.isArray(entry.nodes),
          )
        : [],
    }
  } catch (error) {
    console.error(`[wolke experience] could not read ${path}`, error)
    return { canvas: "dreams.canvas", levels: [] }
  }
}
