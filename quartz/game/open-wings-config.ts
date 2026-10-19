import { existsSync, readFileSync } from "fs"
import { resolve } from "path"
import { parse } from "yaml"
import type { Pigeon } from "./core"

export type OpenWingsConfig = {
  dovecotes: string[]
  pigeons: Pigeon[]
}

type SeedPigeon = Pigeon & { quantity?: number }

function isSeedPigeon(value: unknown): value is SeedPigeon {
  if (typeof value !== "object" || value === null) return false
  const pigeon = value as Record<string, unknown>
  return (
    typeof pigeon.id === "string" &&
    typeof pigeon.homeLoft === "string" &&
    typeof pigeon.currentLocation === "string" &&
    typeof pigeon.status === "string"
  )
}

export function loadOpenWingsConfig(projectRoot = process.cwd()): OpenWingsConfig {
  const path = resolve(projectRoot, "open-wings.yaml")
  if (!existsSync(path)) return { dovecotes: [], pigeons: [] }

  try {
    const parsed = parse(readFileSync(path, "utf8")) as {
      dovecotes?: unknown
      pigeons?: unknown
    }
    const pigeons = Array.isArray(parsed.pigeons)
      ? parsed.pigeons.flatMap((rawPigeon) => {
          if (isSeedPigeon(rawPigeon)) {
            const pigeon = rawPigeon
            const quantity =
              typeof pigeon.quantity === "number" ? Math.max(1, Math.round(pigeon.quantity)) : 1
            return Array.from({ length: quantity }, (_, index) => ({
              id: index === 0 ? pigeon.id : `${pigeon.id}-${index + 1}`,
              homeLoft: pigeon.homeLoft,
              currentLocation: pigeon.currentLocation,
              status: pigeon.status,
            }))
          }
          return []
        })
      : []
    const dovecotes = Array.isArray(parsed.dovecotes)
      ? parsed.dovecotes.filter((dovecote): dovecote is string => typeof dovecote === "string")
      : []
    return { dovecotes, pigeons }
  } catch (error) {
    console.error(`[open wings] could not read ${path}`, error)
    return { dovecotes: [], pigeons: [] }
  }
}
