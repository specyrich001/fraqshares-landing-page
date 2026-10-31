/**
 * About section 1's text on page load, the same recipe as the homepage hero's intro (heroIntroTiming),
 * so the two pages open alike: the H1's lines rise out of their masks one after another, then the two
 * paragraphs fade up. Seconds; positions are from the start of the intro.
 */
export const INTRO_TEXT = {
  /** After the font is ready (lines are split where the real font wraps them). */
  delay: 0.15,
  /** Give up waiting for the font after this long and split with whatever is showing. */
  fontTimeoutMs: 1500,
  // Starts below its mask's widened clip (the clip reaches 0.25em under the line box).
  heading: { yPercent: 130, duration: 1, stagger: 0.1, ease: 'expo.out' },
  paragraphs: { at: 0.45, y: 16, duration: 0.8, stagger: 0.12, ease: 'power3.out' },
}

export const INTRO_TEXT_MEDIA = '(prefers-reduced-motion: no-preference)'
