import type { QuartzComponent, QuartzComponentConstructor } from "../components/types"

// @ts-expect-error - inline script imports are handled by Quartz's build loader
import experienceScript from "./experience.inline.ts"

const Experience: QuartzComponent = () => (
  <section class="wolke-experience" data-wolke-experience>
    <div class="wolke-experience-header">
      <strong>EXP</strong>
      <span data-wolke-exp-value>0 EXP</span>
    </div>
    <div
      class="wolke-experience-bar"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={0}
    >
      <div class="wolke-experience-fill" data-wolke-exp-fill />
    </div>
    <div class="wolke-experience-level" data-wolke-exp-level>
      Level 0
    </div>
  </section>
)

Experience.displayName = "Wolke Experience"
Experience.css = `
.wolke-experience { margin: 1rem 0; padding: .8rem; border: 1px solid var(--lightgray); border-radius: .5rem; background: var(--light); color: var(--darkgray); }
.wolke-experience-header { display: flex; justify-content: space-between; font-family: var(--headerFont); font-size: .8rem; }
.wolke-experience-bar { height: .65rem; margin-top: .55rem; overflow: hidden; border: 1px solid var(--gray); border-radius: 999px; background: var(--lightgray); }
.wolke-experience-fill { width: 0; height: 100%; background: var(--secondary); transition: width 180ms ease-out; }
.wolke-experience-level { margin-top: .5rem; color: var(--secondary); text-align: center; font-family: var(--headerFont); font-size: .8rem; }
`
Experience.afterDOMLoaded = experienceScript

export default (() => Experience) satisfies QuartzComponentConstructor
