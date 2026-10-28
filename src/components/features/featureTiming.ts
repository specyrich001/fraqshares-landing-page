/** Feature carousel timings. */
export const featureTiming = {
  /** Each card stays this long; the active tab's progress line fills over the same time. */
  intervalMs: 4000,
  /** Track slide + peek blur change between cards. */
  slideMs: 700,
  slideEase: 'cubic-bezier(0.65, 0, 0.35, 1)',
  /** The timer only runs while at least this much of the carousel is on screen. */
  visibleThreshold: 0.4,
} as const
