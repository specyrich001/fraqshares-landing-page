/**
 * Hero → "Build wealth" scroll transition. Every timing lives here.
 * Positions are fractions of the transition track: 0 = the stage pins, 1 = the transition ends.
 * Eases are GSAP names; sine curves keep peak speed low (≈1.6× average) so motion reads as a glide.
 */
export const stageTiming = {
  /** Scroll distance of the transition while the stage is pinned, in viewport heights. */
  trackVh: 250,
  /** Then the stage stays pinned this much longer while section 3 scrolls up over section 2. */
  overlapVh: 100,
  /**
   * Seconds the animation takes to catch up with the scrollbar. Lenis (useSmoothScroll) already
   * smooths wheel input, so this stays light — more stacks the two lags and feels floaty.
   */
  scrub: 0.4,

  /** H1, subtext, buttons and activity feed fade out and drift up; responds from the first pixel. */
  heroContentOut: { start: 0, end: 0.15, driftY: -24, ease: 'sine.out' },
  /** The image shrinks from full-bleed into the section-2 slot. */
  shrink: { start: 0, end: 0.5, ease: 'sine.inOut' },
  /** Hero gradient + grain fade out while it shrinks. */
  heroOverlaysOut: { start: 0, end: 0.5, ease: 'sine.inOut' },
  /** Hero photo → section-2 photo. */
  crossfade: { start: 0.2, end: 0.45, ease: 'sine.inOut' },
  /** Section 2's bottom blur fades in toward the end of the shrink. */
  bottomBlurIn: { start: 0.3, end: 0.5, ease: 'sine.inOut' },
  /** 0.5–0.6 holds. Then the heading slides in from the left, the paragraph from the right. */
  textIn: { start: 0.6, end: 0.85, offsetX: 40, ease: 'power3.out' },
  /** The pill and card stack fade in with the text (own micro-animations come later). */
  overlaysIn: { start: 0.6, end: 0.85, ease: 'sine.inOut' },
  /** 0.85–1 holds. Then section 3 slides over (overlapVh), and the stage unpins underneath it. */
} as const

/** Where the pinned sequence runs. Elsewhere the two sections render as the static stack. */
export const STAGE_MEDIA = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'
