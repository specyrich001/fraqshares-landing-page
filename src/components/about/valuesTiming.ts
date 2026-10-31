/**
 * About section 4 (Figma 11051:29334), "Our true north: You!" and the four values. Every trigger,
 * duration and ease. Intro times are seconds from the start of the intro.
 *
 * Below 1024 (VALUES_MEDIA.mobile): one column, so there's no empty column for the title to land in
 * and no travel. The intro (compass and title) plays when the row is a little way up the screen, the
 * paragraphs on their own as they come into view, and each value as it does (VALUES.mobile).
 */
export const VALUES = {
  /** Plays once, when 40% of the intro row is on screen. */
  intro: {
    start: '40% bottom',
    compass: {
      at: 0,
      duration: 0.9,
      ease: 'back.out(1.4)',
      fromScale: 0.9,
      fromRotate: -14,
      /** Then a needle-finding-north settle: degrees, over `wobbleDuration`. */
      wobble: [3, -1.5, 0],
      wobbleDuration: 0.8,
      wobbleEase: 'sine.inOut',
    },
    title: {
      at: 0.15,
      rise: 40,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.1,
      /** "You!" lands after the lines, scaling up from this. */
      youScale: 0.9,
      youDelay: 0.25,
    },
    paragraph: {
      at: 0.35,
      rise: 20,
      duration: 0.6,
      ease: 'power2.out',
      stagger: 0.1,
    },
  },
  /** The title holds still on screen while the intro row scrolls past, then lands beside the values. */
  travel: {
    /** When the intro row's centre is at the viewport's centre … */
    start: 'center center',
    /** … for exactly the distance down to the values grid's top, so it moves with the scroll. */
  },
  /** The values appear in reading order as the title lands. */
  reveal: {
    enabled: true,
    /** When 30% of the grid is on screen. */
    start: '30% bottom',
    rise: 24,
    duration: 0.6,
    ease: 'power3.out',
    stagger: 0.1,
  },
}

/** Below 1024. ScrollTrigger positions are "<element edge> <viewport edge>". */
export const VALUES_MOBILE = {
  /** The intro row's top 30% up the screen: the title, with the compass coming into view under it. */
  introStart: 'top 70%',
  /** The paragraphs and each value: as their top comes 15% up the screen. */
  itemStart: 'top 85%',
}

/** Scroll and intro animations run only with motion allowed; otherwise the Figma frame, all visible.
 *  gsap.matchMedia rebuilds them when the window crosses 1024. */
export const VALUES_MEDIA = {
  desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)',
}
