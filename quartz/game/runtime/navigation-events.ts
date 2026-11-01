import type { EventEngine } from "./event-engine"

type LocationEnteredContext = {
  locationId: string
  pathname: string
}

let initialized = false

export function bindNavigationEvents(
  events: EventEngine,
): void {
  if (initialized) {
    return
  }

  initialized = true

  const emitCurrentLocation = async () => {
    const locationId = getCurrentLocationId()

    if (!locationId) {
      return
    }

    const context: LocationEnteredContext = {
      locationId,
      pathname: window.location.pathname,
    }

    console.debug(
      "[Wolke] location entered",
      context,
    )

    await events.emit(
      "location-entered",
      context,
    )
  }

  // Quartz SPA navigation
  document.addEventListener(
    "nav",
    () => {
      void emitCurrentLocation()
    },
  )

  // Important:
  // also process the page that was already loaded
  // before this listener was attached.
  void emitCurrentLocation()
}


function getCurrentLocationId(): string | null {
  const pathname = decodeURIComponent(
    window.location.pathname,
  )

  const normalized = pathname
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase()

  if (!normalized) {
    return null
  }

  const segments = normalized.split("/")

  return segments.at(-1) ?? null
}
