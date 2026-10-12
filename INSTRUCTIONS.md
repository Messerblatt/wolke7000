Implement a small browser-side game runtime for wolke7000.com,
integrated into this existing Quartz codebase.

First inspect the repository:
- Read applicable AGENTS.md instructions.
- Determine the installed Quartz version and its actual script-loading,
  component registration, and navigation lifecycle.
- Locate existing inventory, chapter-unlocking, persistence, and game
  state logic.
- Follow existing conventions. Do not assume current online Quartz
  documentation matches this repository.

Goal
Create one shared runtime per browser window, accessible through
window.wolkeGame. It must survive Quartz SPA navigation without being
reinitialized. Keep the game logic independent of the browser so it can
later run on a server.

Architecture
Use a dedicated folder such as quartz/game/, adapted to this repository:

- core.ts:
  GameState and GameCommand types, validation, and pure state transitions.
  No window, DOM, storage, network, or Quartz dependencies.

- runtime.ts:
  Owns authoritative game state and exposes:
    execute(command): Promise<void>
    getSnapshot(): GameState
    subscribe(listener): unsubscribe function

  Commands update state through the core.
  Subscribers receive state snapshots.
  Callers must not be able to mutate internal state through returned
  snapshots, initial-state references, or subscription callbacks.

- browser.ts:
  Declares the TypeScript type for window.wolkeGame and provides an
  idempotent getGame() accessor that creates or returns the shared runtime.
  Access window only in browser execution, never during the Quartz build.

- storage.ts, if persistence already exists or is needed:
  Loads and saves versioned player progress.
  Validate saved data and handle malformed or unavailable storage.
  Preserve existing progress and storage keys where possible.

Integration
Include the runtime through Quartz's existing browser-script mechanism.
A component with an inline browser entry script may be appropriate;
confirm this against the installed version.

Place the loader on all pages that need game functionality.
Initialization must not depend on accidental script ordering.
Separate bundles must still resolve to the same window.wolkeGame instance.

Page components should:
1. Render the current snapshot when mounted.
2. Subscribe to future updates.
3. Unsubscribe and remove DOM handlers through Quartz's cleanup lifecycle.

Keep the runtime alive across SPA navigation. Reattach page-specific
bindings without accumulating listeners.

State ownership
Shared facts such as collected items and unlocked chapters belong to the
runtime. UI details such as panel visibility and animation progress remain
local to components.

Use commands to request actions, state to represent lasting facts, and
events only where needed for transient effects such as sounds or notices.
Evaluate progression rules centrally, rather than distributing them
across event listeners.

Scope
Implement the runtime and migrate one existing coherent mechanic,
preferably item collection and its immediate consumers.

Do not invent game mechanics, perform a broad rewrite, add a service
worker, introduce a backend, or add a state-management dependency unless
the repository demonstrates a concrete need.

Future server migration
Keep core rules environment-independent.
Keep execute() asynchronous from the start.
Components should depend on the runtime's public interface so a future
remote client can replace local execution.

Verification
Run the repository's relevant build and checks.
Verify:
- Repeated initialization returns the same instance.
- Snapshots cannot mutate internal state.
- Newly mounted components display existing progress immediately.
- SPA navigation preserves state and does not duplicate subscriptions.
- Persistence, if implemented, survives reloads and handles invalid data.

Add focused tests for meaningful state and lifecycle behavior where the
repository supports them.

Deliver the implementation, then summarize:
- Files changed and the runtime's loading path.
- Which mechanic was migrated.
- Verification performed and any unresolved limitations.