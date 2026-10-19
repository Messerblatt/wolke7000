import type { QuartzComponent, QuartzComponentConstructor } from "../components/types"

// @ts-expect-error - inline script imports are handled by Quartz's build loader
import inventoryScript from "./inventory.inline.ts"

const Inventory: QuartzComponent = () => (
  <section class="wolke-inventory" data-wolke-inventory>
    <div class="wolke-inventory-header">
      <h3>Inventory</h3>
      <span data-wolke-inventory-count>0</span>
    </div>
    <ul class="wolke-inventory-list" data-wolke-inventory-list />
    <button type="button" data-wolke-inventory-show-all>
      Show all
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
Inventory.css = `
.wolke-inventory { margin: 0; padding: .7rem; border: 1px solid var(--lightgray); border-radius: .5rem; background: var(--light); color: var(--darkgray); font-size: .75rem; }
.wolke-inventory-header { display: flex; justify-content: space-between; align-items: baseline; }
.wolke-inventory h3 { margin: 0; color: var(--dark); font-family: var(--headerFont); font-size: .85rem; }
.wolke-inventory-list, .wolke-inventory-all { display: flex; flex-direction: column; gap: .25rem; margin: .6rem 0; padding: 0; list-style: none; }
.wolke-inventory li { display: flex; justify-content: space-between; gap: .75rem; }
.wolke-inventory button { width: 100%; padding: .4rem; border: 1px solid var(--secondary); border-radius: .3rem; background: transparent; color: var(--secondary); cursor: pointer; font: inherit; font-size: .75rem; }
.wolke-inventory-dialog { width: min(24rem, calc(100vw - 2rem)); border: 1px solid var(--lightgray); border-radius: .5rem; background: var(--light); color: var(--darkgray); }
.wolke-inventory-dialog::backdrop { background: rgb(0 0 0 / 45%); }
`
Inventory.afterDOMLoaded = inventoryScript

export default (() => Inventory) satisfies QuartzComponentConstructor
