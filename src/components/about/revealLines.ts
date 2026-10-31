import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

type Options = {
  /** Where each line starts, e.g. { yPercent: 100 } (with mask) or { y: 40, opacity: 0 }. Each property
   *  animates to its resting value (0, or 1 for opacity and scale). */
  from: gsap.TweenVars
  /** Wrap each line in an overflow-clipping mask, so it slides out from behind its own edge. */
  mask?: boolean
  duration: number
  ease: string
  stagger: number
}

const REST: Record<string, number> = { opacity: 1, autoAlpha: 1, scale: 1, scaleX: 1, scaleY: 1 }

/**
 * The About page's heading line reveal (sections 4 and 5), so the effect matches across sections.
 * Splits `el` into lines (SplitText's aria option labels `el` with its text and hides the line spans,
 * so screen readers read one string) and returns the lines' tween, for the caller to place in its
 * timeline with tl.add(tween, at), and the split, to revert to plain text once the reveal is done.
 * Call it when the reveal plays: the lines come from the current layout, fonts included.
 */
export function revealLines(el: HTMLElement, { from, mask = false, duration, ease, stagger }: Options) {
  const split = SplitText.create(el, { type: 'lines', aria: 'auto', ...(mask ? { mask: 'lines' as const } : {}) })
  const to = Object.fromEntries(Object.keys(from).map((key) => [key, REST[key] ?? 0]))
  const tween = gsap.fromTo(split.lines, from, { ...to, duration, ease, stagger })
  return { split, tween }
}
