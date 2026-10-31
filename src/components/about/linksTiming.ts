/**
 * About section 6 (Figma 11063:31700), "Build Your Investment Portfolio with Fraqshares." and the three
 * link cards: the entrance, in seconds from its start. Plays once, when the section is 35% on screen.
 * The cards' hover / focus glow is CSS (about-links.css).
 */
export const LINKS = {
  start: '35% bottom',
  /** Word-by-word masked reveal (revealLines, type words). */
  heading: { at: 0, duration: 0.7, ease: 'power4.out', stagger: 0.04 },
  /** The cards rise in left to right. */
  cards: { at: 0.35, rise: 32, duration: 0.7, ease: 'power3.out', stagger: 0.12 },
  /** Inside each card, its title, description and link row fade up in turn, after the card starts. */
  content: { after: 0.1, rise: 12, duration: 0.4, ease: 'power2.out', stagger: 0.06 },
}

/** The entrance runs only with motion allowed; otherwise the section shows at rest from the start. */
export const LINKS_MEDIA = '(prefers-reduced-motion: no-preference)'
