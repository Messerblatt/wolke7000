import { existsSync, readFileSync } from "fs"
import { resolve } from "path"
import { parse } from "yaml"
import type { Pigeon } from "./core"

export type OpenWingsConfig = {
  pigeons: Pigeon[]
}

export function loadOpenWingsConfig(projectRoot = process.cwd()): OpenWingsConfig {
  const path = resolve(projectRoot, "open-wings.yaml")
  if (!existsSync(path)) return { pigeons: [] }

  try {
    const parsed = parse(readFileSync(path, "utf8")) as Partial<OpenWingsConfig>
    const pigeons = Array.isArray(parsed.pigeons)
      ? parsed.pigeons.filter(
          (pigeon): pigeon is Pigeon =>
            typeof pigeon === "object" &&
            pigeon !== null &&
            typeof pigeon.id === "string" &&
            typeof pigeon.homeLoft === "string" &&
            typeof pigeon.currentLocation === "string" &&
            typeof pigeon.status === "string",
        )
      : []
    return { pigeons }
  } catch (error) {
    console.error(`[open wings] could not read ${path}`, error)
    return { pigeons: [] }
  }
}
