import type { GameEvent } from "../runtime/event-engine"

export const nimbusFirstArrival: GameEvent = {
  id: "nimbus-first-arrival",

  trigger: "location-entered",

  once: true,

  conditions: [
    {
      type: "context-equals",
      key: "locationId",
      value: "nimbus",
    },
  ],

  actions: [
    {
      type: "set-state",
      key: "visited-nimbus",
      value: true,
    },

    {
      type: "set-character-flag",
      characterId: "koko",
      key: "met-player",
      value: true,
    },

    {
      type: "set-character-flag",
      characterId: "fibo",
      key: "player-arrived-on-nimbus",
      value: true,
    },

    {
      type: "set-character-flag",
      characterId: "spasti",
      key: "player-arrived-on-nimbus",
      value: true,
    },
  ],
}

export function registerGameEvents(
  events: EventEngine,
): void {
  events.register(
    nimbusFirstArrival,
  )
}
