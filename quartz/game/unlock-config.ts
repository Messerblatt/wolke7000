import { existsSync, readFileSync } from "fs"
import { resolve } from "path"
import { parse } from "yaml"

export type UnlockCondition = {
  exp?: number
  item?: string
  discovery?: string
  clan?: string | { id: string; level: number }
  feature?: string
  all?: UnlockCondition[]
  any?: UnlockCondition[]
}

export type UnlockFeature = {
  id: string
  kind?: "ui" | "content" | string
  selectors?: string[]
  paths?: string[]
  unlock?: UnlockCondition
}

export type UnlockConfig = {
  version: number
  redirect: string
  defaults: { lockedByDefault: boolean }
  features: UnlockFeature[]
}

const EMPTY_CONFIG: UnlockConfig = {
  version: 1,
  redirect: "Exilium AG",
  defaults: { lockedByDefault: true },
  features: [],
}

export function loadUnlockConfig(projectRoot = process.cwd()): UnlockConfig {
  const path = resolve(projectRoot, "level-unlock.yaml")
  if (!existsSync(path)) return EMPTY_CONFIG

  try {
    const parsed = parse(readFileSync(path, "utf8")) as Partial<UnlockConfig>
    const features = Array.isArray(parsed.features)
      ? parsed.features.filter(
          (feature): feature is UnlockFeature =>
            typeof feature === "object" && feature !== null && typeof feature.id === "string",
        )
      : []

    return {
      version:
        typeof parsed.version === "number" && Number.isInteger(parsed.version) ? parsed.version : 1,
      redirect: typeof parsed.redirect === "string" ? parsed.redirect : EMPTY_CONFIG.redirect,
      defaults: { lockedByDefault: parsed.defaults?.lockedByDefault !== false },
      features,
    }
  } catch (error) {
    console.error(`[wolke unlocks] could not read ${path}`, error)
    return EMPTY_CONFIG
  }
}
