/**
 * Testimonials pinned sequence: heading → stacked cards → split row. Every distance and proportion
 * lives here. Positions are fractions of the pinned scroll (0 = the stage pins, 1 = it releases).
 */
export const testimonialsTiming = {
  /** Height of the tall wrapper; the stage is pinned for this minus one viewport of scroll. */
  trackVh: 250,
  /** Seconds the scrubbed timeline takes to catch up with the scrollbar (Lenis smooths wheel input already). */
  scrub: 0.4,

  /** 0–0.15 holds on the heading. Cards rise in, back to front, ending stacked at 0.5. */
  enter: { start: 0.15, end: 0.5, stagger: 0.07, ease: 'power2.out' },
  /**
   * Where each card starts: below the stage by half its height plus this clearance, so none of it
   * shows in state 1 (the brief's ~60vh leaves the card tops on screen at 820px tall). Each starts
   * turned a little further than its stacked rotation.
   */
  enterClearancePx: 40,
  enterExtraRotation: 5,
  /** The heading fades over the same range, to this opacity (Figma: 10%). */
  headingDimmed: 0.1,
  /** 0.5–0.6 holds stacked. Then the stack splits into the row. */
  split: { start: 0.6, end: 0.85, ease: 'power2.inOut' },
  /** 0.85–1 holds on the row, then the stage releases. */

  /** Snap to the three rest states (the end of each hold). */
  snap: true,
  snapDuration: { min: 0.2, max: 0.6 },
  snapDelay: 0.1,

  /** The split row is ~1180px wide: below this viewport width the card group scales down to fit. */
  fitWidth: 1280,
} as const

/** Rest points: the end of each hold. */
export const REST = [0.15, 0.6, 1] as const

/**
 * Card geometry from Figma (Desktop - 18 10815:83135, Testimonial 10821:86101). Rotations are CSS
 * degrees (Figma's sign is the opposite). x is the card centre's offset from the stage centre.
 */
export const cardStates = {
  a: { stacked: 3, split: 3, x: -386.26 },
  b: { stacked: 0, split: -1, x: 0 },
  c: { stacked: -5, split: -3, x: 386.27 },
} as const

/** Pinned at 1024px and up with motion allowed; otherwise the static split layout. */
export const TESTIMONIALS_MEDIA = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'
export const FIT_MEDIA = '(min-width: 1024px)'
