import type { QuartzComponent, QuartzComponentConstructor } from "../components/types"

// @ts-expect-error - inline script imports are handled by Quartz's build loader
import inventoryScript from "./inventory.inline.ts"

const inventoryCss = `
.wolke-inventory {
  margin: 0.8rem 0;
  padding: 0.75rem;
  border: 1px solid var(--lightgray);
  border-radius: 0.5rem;
  background: var(--light);
  color: var(--darkgray);
}

.wolke-inventory-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.wolke-inventory-title {
  margin: 0;
  color: var(--dark);
  font-family: var(--headerFont);
  font-size: 0.85rem;
}

.wolke-inventory-count {
  color: var(--gray);
  font-size: 0.75rem;
}

.wolke-inventory-list,
.wolke-inventory-all {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0.65rem 0;
  padding: 0;
  list-style: none;
  font-size: 0.75rem;
}

.wolke-inventory-list li,
.wolke-inventory-all li {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.wolke-inventory button {
  width: 100%;
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--secondary);
  border-radius: 0.35rem;
  background: transparent;
  color: var(--secondary);
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
}

.wolke-inventory button:hover {
  background: var(--highlight);
}

.wolke-inventory-dialog {
  width: min(24rem, calc(100vw - 2rem));
  border: 1px solid var(--lightgray);
  border-radius: 0.5rem;
  background: var(--light);
  color: var(--darkgray);
}

.wolke-inventory-dialog::backdrop {
  background: rgb(0 0 0 / 45%);
}
`

const Inventory: QuartzComponent = () => (
  <section class="wolke-inventory" data-wolke-inventory>
    <div class="wolke-inventory-header">
      <h3 class="wolke-inventory-title">Inventory</h3>
      <span class="wolke-inventory-count" data-wolke-inventory-count>
        0
      </span>
    </div>
    <ul class="wolke-inventory-list" data-wolke-inventory-list />
    <button type="button" data-wolke-inventory-show-all>
      Show All
    </button>
    <dialog class="wolke-inventory-dialog" data-wolke-inventory-dialog>
      <h3>Inventory</h3>
      <ul class="wolke-inventory-all" data-wolke-inventory-all />
      <button type="button" data-wolke-inventory-close>
        Close
      </button>
    </dialog>
  </section>
)

Inventory.displayName = "Wolke Inventory"
Inventory.css = inventoryCss
Inventory.afterDOMLoaded = inventoryScript

export default (() => Inventory) satisfies QuartzComponentConstructor
