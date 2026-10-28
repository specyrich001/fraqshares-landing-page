/** A feature card's micro-animation, driven by the section 3 carousel. */
export type CardController = {
  /** Start (or resume) the card's animation: intro, then its own sequence. */
  play: () => void
  /** Freeze everything where it is. */
  pause: () => void
  /** Back to the hidden initial state, ready to play again. */
  reset: () => void
}

/**
 * The active copy of each card registers here, keyed by card index (0–3: card 1 is 0), so the carousel or the
 * console can reach it. Cards also follow their `active` / `playing` props, which is how the
 * carousel drives them normally.
 */
export const cardControllers = new Map<number, CardController>()
