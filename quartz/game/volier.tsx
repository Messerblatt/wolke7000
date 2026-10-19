import type { QuartzComponent, QuartzComponentConstructor } from "../components/types"

// @ts-expect-error - inline script imports are handled by Quartz's build loader
import volierScript from "./volier.inline.ts"

const volierCss = `
.wolke-volier { margin-top: 1rem; padding: 0.8rem; border: 1px solid var(--lightgray); border-radius: 0.5rem; background: var(--light); color: var(--darkgray); }
.wolke-volier-title { margin: 0; color: var(--dark); font-family: var(--headerFont); font-size: 0.85rem; }
.wolke-volier-count { display: block; margin: 0.2rem 0 0.55rem; color: var(--secondary); font-family: var(--headerFont); font-size: 0.75rem; }
.wolke-volier-list { margin: 0 0 0.65rem; padding-left: 1rem; color: var(--gray); font-size: 0.7rem; }
.wolke-volier button { width: 100%; padding: 0.4rem 0.55rem; border: 1px solid var(--secondary); border-radius: 0.35rem; background: transparent; color: var(--secondary); cursor: pointer; font: inherit; font-size: 0.75rem; }
.wolke-volier button:disabled { cursor: not-allowed; opacity: 0.5; }
.wolke-volier-dialog { width: min(22rem, calc(100vw - 2rem)); border: 1px solid var(--lightgray); border-radius: 0.5rem; background: var(--light); color: var(--darkgray); }
.wolke-volier-dialog::backdrop { background: rgb(0 0 0 / 45%); }
.wolke-volier-dialog label { display: block; margin: 0.75rem 0; font-size: 0.8rem; }
.wolke-volier-dialog select, .wolke-volier-dialog input { display: block; width: 100%; box-sizing: border-box; margin-top: 0.3rem; padding: 0.4rem; border: 1px solid var(--lightgray); background: var(--light); color: var(--darkgray); font: inherit; }
.wolke-volier-dialog-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
`

const Volier: QuartzComponent = () => (
  <section class="wolke-volier" data-wolke-volier>
    <h3 class="wolke-volier-title">Aviary</h3>
    <span class="wolke-volier-count" data-wolke-volier-count>
      0
    </span>
    <ul class="wolke-volier-list" data-wolke-volier-list />
    <button type="button" data-wolke-get-wings hidden>
      Get Wings
    </button>
    <dialog class="wolke-volier-dialog" data-wolke-volier-dialog>
      <h3>Get Wings</h3>
      <label>
        Dovecote
        <select data-wolke-volier-loft />
      </label>
      <label>
        Quantity
        <input type="number" min="1" max="20" value="1" data-wolke-volier-quantity />
      </label>
      <div class="wolke-volier-dialog-actions">
        <button type="button" data-wolke-claim-wings>
          Get Wings
        </button>
        <button type="button" data-wolke-close-dialog>
          Close
        </button>
      </div>
    </dialog>
  </section>
)

Volier.displayName = "Wolke Volier"
Volier.css = volierCss
Volier.afterDOMLoaded = volierScript

export default (() => Volier) satisfies QuartzComponentConstructor
