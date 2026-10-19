import type { QuartzComponent, QuartzComponentConstructor } from "../components/types"

// @ts-expect-error - inline script imports are handled by Quartz's build loader
import experienceScript from "./experience.inline.ts"

const experienceCss = `
.wolke-experience {
  margin-top: 1rem;
  padding: 0.8rem;
  border: 1px solid var(--lightgray);
  border-radius: 0.5rem;
  background: var(--light);
  color: var(--darkgray);
}

.wolke-experience-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
}

.wolke-experience-title,
.wolke-experience-value,
.wolke-experience-level {
  font-family: var(--headerFont);
}

.wolke-experience-title {
  color: var(--dark);
  font-size: 0.85rem;
  font-weight: 600;
}

.wolke-experience-value {
  color: var(--gray);
  font-size: 0.75rem;
}

.wolke-experience-bar {
  height: 0.65rem;
  overflow: hidden;
  border: 1px solid var(--gray);
  border-radius: 999px;
  background: var(--lightgray);
}

.wolke-experience-fill {
  width: 0;
  height: 100%;
  border-radius: inherit;
  background: var(--secondary);
  transition: width 180ms ease-out;
}

.wolke-experience-level {
  margin-top: 0.55rem;
  color: var(--secondary);
  font-size: 0.8rem;
  text-align: center;
}
`

const Experience: QuartzComponent = () => (
  <section class="wolke-experience" data-wolke-experience>
    <div class="wolke-experience-header">
      <span class="wolke-experience-title">EXP</span>
      <span class="wolke-experience-value" data-wolke-exp-value>
        0 EXP
      </span>
    </div>
    <div
      class="wolke-experience-bar"
      data-wolke-exp-bar
      role="progressbar"
      aria-label="Experience progress"
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
Experience.css = experienceCss
Experience.afterDOMLoaded = experienceScript

export default (() => Experience) satisfies QuartzComponentConstructor
