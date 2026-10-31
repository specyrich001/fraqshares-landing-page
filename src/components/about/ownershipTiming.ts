/**
 * About section 5 (Figma 11053:31692), "A clearer path to ownership.": the entrance, in seconds from
 * its start. Plays once, when the section is 35% on screen.
 */
export const OWNERSHIP = {
  start: '35% bottom',
  /** Masked line reveal (revealLines): each line slides up from behind its own edge. */
  heading: { at: 0, duration: 0.8, ease: 'power4.out', stagger: 0.12 },
  paragraphs: { at: 0.4, rise: 24, duration: 0.7, ease: 'power3.out', stagger: 0.12 },
  /** Optional: the photo settles in before the cards. Off by default. */
  image: { enabled: false, at: 0, fromScale: 1.06, duration: 1, ease: 'power2.out' },
  /** The back card rises into place and fades up to its own opacity (0.64, from its class). */
  back: { at: 0.3, rise: 24, duration: 0.5, ease: 'power3.out' },
  /** The front card lands on it with a bounce, from its bottom centre. */
  front: { at: 0.45, rise: 32, fromScale: 0.9, duration: 0.65, ease: 'back.out(1.6)' },
  /** Then its content fills in: the thumbnail, then the title and meta. */
  content: { at: 0.6, thumbScale: 0.85, rise: 4, duration: 0.3, stagger: 0.05, ease: 'power2.out' },
  /** The back card's amount pulses, like the hero's amounts. */
  amount: { at: 1.1, peak: 1.08, duration: 0.3, ease: 'sine.inOut' },
}

/** The entrance runs only with motion allowed; otherwise the final state shows from the start. */
export const OWNERSHIP_MEDIA = '(prefers-reduced-motion: no-preference)'
