import {
  EMPTY_GAME_STATE,
  applyCommand,
  cloneState,
  isGameState,
  type GameCommand,
  type GameState,
} from "./core"
import { loadGameState, saveGameState, type GameStorage } from "./storage"

export type GameSubscriber = (snapshot: GameState) => void

export interface GameRuntimeOptions {
  initialState?: GameState
  storage?: GameStorage | null
  now?: () => number
}

export class GameRuntime {
  #state: GameState
  readonly #storage: GameStorage | null
  readonly #now: () => number
  readonly #subscribers = new Set<GameSubscriber>()
  #queue: Promise<void> = Promise.resolve()

  constructor(options: GameRuntimeOptions = {}) {
    this.#storage = options.storage ?? null
    this.#now = options.now ?? Date.now
    const initial = options.initialState ?? loadGameState(this.#storage)
    this.#state = cloneState(isGameState(initial) ? initial : EMPTY_GAME_STATE)
  }

  getSnapshot(): GameState {
    return cloneState(this.#state)
  }

  subscribe(listener: GameSubscriber): () => void {
    this.#subscribers.add(listener)
    listener(this.getSnapshot())
    return () => this.#subscribers.delete(listener)
  }

  execute(command: GameCommand): Promise<void> {
    const run = this.#queue.then(() => {
      this.#state = applyCommand(this.#state, command, this.#now())
      saveGameState(this.#storage, this.#state)
      this.notify()
    })

    // A rejected command must not block later valid commands, while the
    // caller still receives the original rejection from its returned promise.
    this.#queue = run.catch(() => undefined)
    return run
  }

  reset(): Promise<void> {
    const run = this.#queue.then(() => {
      this.#state = cloneState(EMPTY_GAME_STATE)
      saveGameState(this.#storage, this.#state)
      this.notify()
    })
    this.#queue = run.catch(() => undefined)
    return run
  }

  private notify(): void {
    for (const subscriber of this.#subscribers) {
      try {
        // Each subscriber receives a separate snapshot. A component that
        // mutates its callback argument cannot affect another component.
        subscriber(this.getSnapshot())
      } catch {
        // One broken UI subscriber must not prevent the game from updating.
      }
    }
  }
}
