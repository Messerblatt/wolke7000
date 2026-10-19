import type { QuartzComponent, QuartzComponentConstructor } from "../components/types"

// @ts-expect-error - inline script imports are handled by Quartz's build loader
import volierScript from "./volier.inline.ts"

const volierCss = `
.wolke-volier {
  margin: 0;
  padding: 0.8rem;
  border: 1px solid var(--lightgray);
  border-radius: 0.5rem;
  background: var(--light);
  color: var(--darkgray);
}

.wolke-volier-title,
.wolke-volier-count {
  font-family: var(--headerFont);
}

.wolke-volier-title {
  margin: 0;
  color: var(--dark);
  font-size: 0.85rem;
}

.wolke-volier-count {
  display: block;
  margin: 0.2rem 0 0.55rem;
  color: var(--secondary);
  font-size: 0.75rem;
}

.wolke-volier-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(2.25rem, 1fr));
  gap: 0.35rem;
  margin: 0 0 0.65rem;
  padding: 0;
  list-style: none;
}

.wolke-volier-pigeon {
  width: 2.25rem;
  height: 2.25rem;
  object-fit: contain;
}

.wolke-volier button {
  width: 100%;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--secondary);
  border-radius: 0.35rem;
  background: transparent;
  color: var(--secondary);
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
}

.wolke-volier button:hover:not(:disabled) {
  background: var(--highlight);
}

.wolke-volier button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.wolke-volier-dialog {
  width: 66%;
  height: 66%;
  margin: auto;
  padding: 1rem;
  border: 1px solid var(--lightgray);
  border-radius: 0.25rem;
  background: var(--light);
  color: var(--darkgray);
}

.wolke-volier-dialog h3 {
  margin: 0 0 0.8rem;
  font-family: var(--headerFont);
  font-size: 1rem;
}

.wolke-volier-dialog::backdrop {
  background: rgb(0 0 0 / 45%);
}

.wolke-volier-dialog label {
  display: block;
  margin: 0.75rem 0;
  font-size: 0.8rem;
}

.wolke-volier-dialog select,
.wolke-volier-dialog input {
  display: block;
  width: 100%;
  margin-top: 0.3rem;
  box-sizing: border-box;
  padding: 0.4rem;
  border: 1px solid var(--lightgray);
  background: var(--light);
  color: var(--darkgray);
  font: inherit;
}

.wolke-volier-dialog-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.wolke-volier-info-dialog .wolke-volier-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0 0 0.8rem;
  font-size: 0.75rem;
}

.wolke-volier-send-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.wolke-volier-send-columns h4 {
  margin: 0 0 0.4rem;
  font-family: var(--headerFont);
  font-size: 0.8rem;
}

.wolke-volier-send-columns select {
  width: 100%;
  min-height: 7rem;
}

.wolke-letter-toast {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 10000;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--secondary);
  border-radius: 0.35rem;
  background: var(--light);
  color: var(--dark);
  box-shadow: 0 0.3rem 1rem rgb(0 0 0 / 25%);
}
`

const Volier: QuartzComponent = () => (
  <section class="wolke-volier" data-wolke-volier>
    <h3 class="wolke-volier-title">Aviary</h3>
    <ul class="wolke-volier-list" data-wolke-volier-list />
    <button type="button" data-wolke-get-wings hidden>
      Get Wings
    </button>
    <button type="button" data-wolke-volier-show-all>
      Show All
    </button>
    <dialog class="wolke-volier-dialog" data-wolke-volier-dialog>
      <h3>Get Wings</h3>
      <label>
        Dovecote
        <select data-wolke-volier-loft />
      </label>
      <label>
        Quantity
        <input type="number" min="1" max="3" value="1" data-wolke-volier-quantity />
      </label>
      <div class="wolke-volier-dialog-actions">
        <button type="button" data-wolke-claim-wings>
          Get Wings
        </button>
        <button type="button" data-wolke-close-dialog>
          Cancel
        </button>
      </div>
    </dialog>
    <dialog class="wolke-volier-dialog wolke-volier-info-dialog" data-wolke-volier-info-dialog>
      <h3>Send Letter</h3>
      <div class="wolke-volier-send-columns">
        <section>
          <h4>Letters</h4>
          <select data-wolke-letter-select size={6} />
        </section>
        <section>
          <h4>Available Wings</h4>
          <select data-wolke-wing-select size={6} />
        </section>
      </div>
      <button type="button" data-wolke-send-letter>
        Send Letter
      </button>
      <button type="button" data-wolke-volier-close-info>
        Close
      </button>
    </dialog>
  </section>
)

Volier.displayName = "Wolke Volier"
Volier.css = volierCss
Volier.afterDOMLoaded = volierScript

export default (() => Volier) satisfies QuartzComponentConstructor
