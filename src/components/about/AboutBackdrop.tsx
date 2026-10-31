import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef, type ReactNode } from 'react'
import { MISSION, MISSION_MEDIA } from './missionTiming.ts'
import './about-backdrop.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** DEV: ?stack=… shows section 3's static states, so the backdrop shows its end state (dark). */
const devDark = () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('stack')

/**
 * One backdrop behind About sections 2 and 3, so there is no hard edge between section 2's #FAFAFA and
 * section 3's #0E1711. With the scroll scenes on, both sections go transparent and a dark layer over
 * the grey fades in (opacity, scrubbed) as section 3 comes up (MISSION.backdrop); section 2's statement
 * and hands fade out over the same range, so dark text never sits on the darkening background.
 * Scrolling back reverses it. Without the scenes each section keeps its own solid background.
 *
 * relative z-10 + bg: it spans both sections and their pin spacers and stays above the footer, which
 * waits shifted up behind the page for its reveal (SiteFooter), so nothing shows through mid-pin.
 *
 * Its effect runs after its children's, so this trigger is created after both sections' pins.
 */
export function AboutBackdrop({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MISSION_MEDIA, () => {
        const root = ref.current!
        const dark = root.querySelector<HTMLElement>('[data-backdrop-dark]')!
        const mission = root.querySelector<HTMLElement>('[data-mission]')!
        const storyStage = root.querySelector<HTMLElement>('[data-story-stage]')!
        const frozen = devDark()
        const B = MISSION.backdrop
        root.dataset.fade = ''

        const tl = gsap.timeline({
          defaults: { ease: B.ease },
          paused: frozen,
          scrollTrigger: frozen ? undefined : { trigger: mission, start: B.start, end: B.end, scrub: B.scrub },
        })
        tl.fromTo(dark, { opacity: 0 }, { opacity: 1 }, 0)
        tl.fromTo(storyStage, { opacity: 1 }, { opacity: 0 }, 0)
        if (frozen) tl.progress(1)

        return () => {
          delete root.dataset.fade
        }
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} data-about-backdrop className="relative z-10 bg-soft">
      <div data-backdrop-dark aria-hidden="true" />
      {children}
    </div>
  )
}
