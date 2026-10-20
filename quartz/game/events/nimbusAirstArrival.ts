import  {
  GameEvent
} from "./event-engine"


const nimbusFirstArrival: GameEvent = {
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
  ],
}