/** A step graphic's micro-animation, driven by the "Getting started" scroll sequence. */
export type StepController = {
  /** Start (or resume) the graphic's sequence. */
  play: () => void
  /** Freeze everything where it is. */
  pause: () => void
  /** Back to the initial state, ready to play again. */
  reset: () => void
}

/**
 * Each animated step graphic registers here, keyed by step index (0–4: step 1 is 0, as with
 * cardControllers), so the console can reach it. Graphics also follow their `active` / `playing`
 * props, which is how StepsSection drives them normally.
 */
export const stepControllers = new Map<number, StepController>()

declare global {
  interface Window {
    /** DEV only: the step graphics' controllers, for tuning and recordings in the console. */
    stepControllers?: typeof stepControllers
  }
}
if (import.meta.env.DEV) window.stepControllers = stepControllers

/**
 * From StepsSection. `active` false: the step has left (its frame fully collapsed, or not yet grown), so
 * reset. `playing`: the step is at rest and on screen. Both undefined outside the pinned sequence
 * (under 1024px), where a graphic plays while it is on screen.
 */
export type StepGraphicProps = { active?: boolean; playing?: boolean }
