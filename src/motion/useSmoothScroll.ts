import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect } from 'react'

gsap.registerPlugin(ScrollTrigger)

/** Higher = snappier, lower = glidier. 0.1 turns a 100px wheel notch into ~0.4s of motion. */
const LERP = 0.1

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis read the same frame.
 * Wheel notches become a continuous glide instead of 100px jumps, which is what makes scrubbed
 * scenes feel smooth. Touch keeps native scrolling (Lenis default). Off for reduced motion.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ lerp: LERP })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    // Lenis already smooths; GSAP's lag smoothing would make the two disagree after a dropped frame.
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [])
}
