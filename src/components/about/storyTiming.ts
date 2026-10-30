/**
 * About section 2 (Figma 11049:456): every scroll position, duration and ease for its two phases.
 *
 * Phase A, highlight (no pin): the paragraphs' words go from --text-dim to #111 in reading order.
 * Phase B, hands (pinned): the hands slide in from the screen edges and meet, then the closing
 * statement rises in line by line. Its timeline runs 0 → 1 over the pin; positions are fractions.
 */
export const STORY = {
  highlight: {
    /** 'words' or 'lines': the unit that changes colour. */
    by: 'words' as 'words' | 'lines',
    /** The paragraph block's top at 75% down the viewport … */
    start: 'top 75%',
    /** … to its bottom at 45%. */
    end: 'bottom 45%',
    scrub: 0.3,
    /** How many units are mid-fade at once: each one fades over this many units' worth of scroll,
     *  so the highlight's edge is soft rather than stepped. */
    softness: 3,
  },
  pin: {
    /** Pins when the hands + statement group's centre reaches the viewport's centre. */
    start: 'center center',
    /** Pin length, in viewport heights. */
    length: 1.5,
    scrub: 0.5,
  },
  hands: {
    from: 0,
    to: 0.6,
    ease: 'power2.out',
    /** Extra px past the screen edge in the start state. */
    offscreen: 40,
    /** Reaching in: the hands start tilted and settle level (degrees; about the off-screen arm end). */
    rotate: true,
    rotateLeft: -2,
    rotateRight: 2,
  },
  statement: {
    from: 0.55,
    to: 0.85,
    /** Each line rises from this many px below. */
    rise: 24,
    /** One line's fade, and the gap between line starts (fractions of the pin). */
    line: 0.16,
    stagger: 0.05,
    ease: 'power2.out',
    /** The amount (₦25,000) gets a beat of its own: it ends at `to`, after the lines, scaling up from this. */
    amountScale: 0.96,
  },
  /** 0.85 → 1: hold, then unpin. */
}

/** The scroll scene runs only with motion allowed; otherwise everything shows in its final state. */
export const STORY_MEDIA = '(prefers-reduced-motion: no-preference)'
