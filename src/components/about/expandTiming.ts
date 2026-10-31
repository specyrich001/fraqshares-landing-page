/**
 * About section 1: the photo opens from the 1280 row to the full window width as the page scrolls.
 * ScrollTrigger positions are "<photo edge> <viewport edge>" on the photo's static (1280 × 628) box.
 */
export const EXPAND = {
  /** Starts when the photo's top passes 80% down the viewport (its top enters the bottom 20%).
   *  clamp(): at 1440 × 900 the photo's top is already above that line on load, so without it the
   *  page would open part-expanded. Clamped, the expansion starts from the top of the page instead. */
  start: 'clamp(top 80%)',
  /** Done when the photo's centre reaches the viewport's centre. */
  end: 'center center',
  /** Seconds the scrub takes to catch up with the scroll. */
  scrub: 0.5,
  /** Inner parallax: the image also scales from `from` to 1 over the same range. Off by default. */
  parallax: false,
  parallaxFrom: 1.08,
}

/** Figma 11049:450: 1279 × 628. The full-bleed photo keeps this ratio. */
export const PHOTO_ASPECT = 1279 / 628

/** Desktop only, and only with motion allowed; otherwise the photo stays at its Figma size. Below 1024
 *  the photo is already full-bleed (Figma 11074:45134), so there's nothing to open. */
export const EXPAND_MEDIA = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'
