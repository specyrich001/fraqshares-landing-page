/**
 * Hero intro on page load: the headline's lines rise out of masks one after another, then the
 * paragraph and the two buttons fade up. Seconds; positions are from the start of the intro.
 */
export const heroIntroTiming = {
  /** After the font is ready (lines are split where the real font wraps them). */
  delay: 0.15,
  /** Give up waiting for the font after this long and split with whatever is showing. */
  fontTimeoutMs: 1500,

  // Starts below its mask's widened clip (the clip reaches 0.25em under the line box).
  headline: { yPercent: 130, duration: 1, stagger: 0.1, ease: 'expo.out' },
  paragraph: { at: 0.45, y: 16, duration: 0.8, ease: 'power3.out' },
  buttons: { at: 0.6, y: 16, duration: 0.8, stagger: 0.08, ease: 'power3.out' },
} as const
