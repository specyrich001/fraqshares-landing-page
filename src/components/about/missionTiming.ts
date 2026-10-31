/**
 * About section 3 (Figma 11050:465), Mission and Vision, and the backdrop fade into it from
 * section 2. Every scroll position and ease. ScrollTrigger positions are "<section edge> <viewport edge>"
 * on section 3; the pinned stack's timeline runs 0 → 1 over the pin, so its positions are fractions.
 */
export const MISSION = {
  /** Section 2's #FAFAFA turns into section 3's #0E1711 as section 3 comes up, and section 2's
   *  statement and hands fade out over the same range. Section 2 unpins before this starts
   *  (about-story.css keeps it covering the screen to the end of its pin). */
  backdrop: {
    start: 'top bottom',
    end: 'top 40%',
    scrub: 0.3,
    ease: 'none',
  },
  /** Mission rises in as the section comes up, done as the pin starts. */
  enter: {
    start: 'top 70%',
    end: 'top top',
    rise: 60,
    scrub: 0.3,
    ease: 'power2.out',
  },
  pin: {
    /** Pins once the (100vh) section fills the screen; the backdrop fade is done by then. */
    start: 'top top',
    /** Pin length, in viewport heights. */
    length: 1.2,
    scrub: 0.5,
  },
  stack: {
    /** 0 → `from`: hold, so Mission reads on its own. */
    from: 0.15,
    /** The other cards slide up from below the screen between `from` and `to`, one after another. */
    to: 0.7,
    ease: 'power2.out',
    /** Extra px below the screen's bottom edge where an incoming card waits. */
    offscreen: 40,
    /** As a card lands, the cards behind it dim their text (their background stays). */
    behindOpacity: 0.6,
    /** Each card sits this much lower than the one before it. */
    step: 40,
  },
  /** `to` → 1: hold on the stack, then unpin. */
}

/** Scroll scenes run only with motion allowed; otherwise each section keeps its own background and the
 *  cards sit side by side. */
export const MISSION_MEDIA = '(prefers-reduced-motion: no-preference)'
