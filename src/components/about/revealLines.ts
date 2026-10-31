import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

type Options = {
  /** Split into lines (default) or words. */
  type?: 'lines' | 'words'
  /** Where each line starts, e.g. { yPercent: 100 } (with mask) or { y: 40, opacity: 0 }. Each property
   *  animates to its resting value (0, or 1 for opacity and scale). */
  from: gsap.TweenVars
  /** Wrap each line (or word) in an overflow-clipping mask, so it slides out from behind its own edge. */
  mask?: boolean
  duration: number
  ease: string
  stagger: number
}

const REST: Record<string, number> = { opacity: 1, autoAlpha: 1, scale: 1, scaleX: 1, scaleY: 1 }

/**
 * The About page's heading reveal (sections 4, 5 and 6), so the effect matches across sections.
 * Splits `el` into lines or words (SplitText's aria option labels `el` with its text and hides the
 * pieces, so screen readers read one string; nested spans such as a split-tone colour are kept) and
 * returns their tween, for the caller to place in its timeline with tl.add(tween, at), and the split,
 * to revert to plain text once the reveal is done. Call it when the reveal plays: lines come from the
 * current layout, fonts included.
 */
export function revealLines(el: HTMLElement, { type = 'lines', from, mask = false, duration, ease, stagger }: Options) {
  const split = SplitText.create(el, { type, aria: 'auto', ...(mask ? { mask: type } : {}) })
  const to = Object.fromEntries(Object.keys(from).map((key) => [key, REST[key] ?? 0]))
  const tween = gsap.fromTo(type === 'words' ? split.words : split.lines, from, { ...to, duration, ease, stagger })
  return { split, tween }
}
