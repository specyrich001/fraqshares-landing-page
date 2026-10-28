/**
 * "Getting started" pinned step sequence. Every distance and proportion lives here.
 *
 * The timeline runs in step units: step k (0-based) owns [k, k + 1). Its first `hold` is rest, the
 * rest is the transition to step k + 1. The last step only has its hold, then the stage releases.
 * Positions inside a transition (`*Span`) are fractions of that transition.
 */
export const stepsTiming = {
  /** Scroll distance of one step's segment, in viewport heights. */
  segmentVh: 100,
  /** Share of each segment that holds still before the transition starts. */
  hold: 0.4,
  /** Seconds the scrubbed timeline takes to catch up with the scrollbar (Lenis smooths wheel input already). */
  scrub: 0.4,
  /** Shrink/grow of the frames and the cover fade. */
  ease: 'power2.inOut',

  /** Outgoing frame's screens fade out early, incoming frame's screens fade in late. */
  contentOutSpan: [0, 0.4],
  contentInSpan: [0.6, 1],
  /** Olive cover: fades in as the frame shrinks, out as the next one grows (whole transition). */
  coverSpan: [0, 1],
  /** The old top square leaves as the new one arrives; the new bottom square appears as the old one leaves. */
  topSquareOutSpan: [0.5, 1],
  bottomSquareInSpan: [0, 0.5],
  /** Step text: out in the first half, in in the second, each with a small upward drift. Never overlap. */
  textOutSpan: [0, 0.5],
  textInSpan: [0.5, 1],
  textDriftY: 12,
  /** The active indicator segment (and aria-current) moves to the next step here. */
  switchAt: 0.5,

  /** Snap the scroll to the end of each hold, so the page never rests mid-transition. */
  snap: true,
  snapDuration: { min: 0.2, max: 0.6 },
  snapDelay: 0.1,

  /**
   * The stage content (Figma 1440 wide; top square to bottom square is 810px) scales down to fit:
   * below 1440px wide, and below this viewport height (810 + 30px either side).
   */
  designWidth: 1440,
  fitHeight: 870,

  /** Indicator segments move with a short CSS transition when the active step changes. */
  indicatorMs: 300,
} as const

/**
 * Mobile pinned sequence (below 1024px): no squares, so steps switch with a timed crossfade when the
 * scroll crosses a transition's switch point. Seconds.
 */
export const stepsMobile = {
  crossfade: { duration: 0.4, ease: 'power2.out', outScale: 0.96, inScale: 1.04 },
  /** While pinned, the lowest indicator stays at least this far above the screen's bottom edge, px. */
  edge: 24,
} as const

export const STEPS_COUNT = 5

/** Where the pinned sequence runs. Narrower: the five steps render as stacked static blocks. */
export const STEPS_MEDIA = '(min-width: 1024px)'
/** Below it, the mobile pinned sequence (stepsMobile). */
export const MOBILE_MEDIA = '(max-width: 1023.98px)'
export const REDUCED_MEDIA = '(prefers-reduced-motion: reduce)'
