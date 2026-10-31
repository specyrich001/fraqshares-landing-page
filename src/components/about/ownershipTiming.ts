/**
 * About section 5 (Figma 11053:31692), "A clearer path to ownership.": the entrance, in seconds from
 * its start. Plays once, when the section is 35% on screen.
 *
 * Below 1024 the photo sits under the text, so the text and the cards play on their own triggers
 * (OWNERSHIP_MOBILE), each with the same timings as here.
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

/** Below 1024. ScrollTrigger positions are "<element edge> <viewport edge>". */
export const OWNERSHIP_MOBILE = {
  /** The heading and paragraphs: as the heading's top comes 15% up the screen. */
  textStart: 'top 85%',
  /** The cards: as the photo's centre comes 20% up the screen (the cards, 40% down it, are in view). */
  cardsStart: 'center 80%',
}

/** The entrance runs only with motion allowed; otherwise the final state shows from the start.
 *  gsap.matchMedia rebuilds it when the window crosses 1024. */
export const OWNERSHIP_MEDIA = {
  desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)',
}
