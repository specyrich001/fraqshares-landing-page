import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef, type ReactNode } from 'react'
import { INTRO_TEXT as I, INTRO_TEXT_MEDIA } from '../about/introTiming.ts'
import { revealLines } from '../about/revealLines.ts'
import { LocationIcon, MailIcon, PhoneIcon } from '../icons/ContactIcons.tsx'
import { focusRingOnDark } from '../linkStyles.ts'
import { CONTACT_DETAILS } from './contactDetails.ts'
import { ContactForm } from './ContactForm.tsx'

gsap.registerPlugin(useGSAP)

/** Mint 16px / 140%, underlined on hover and focus only. */
const link = `text-footer-link text-mint decoration-1 underline-offset-4 hover:underline focus-visible:underline ${focusRingOnDark}`

function Detail({ icon, align = 'center', children }: { icon: ReactNode; align?: 'center' | 'start'; children: ReactNode }) {
  return (
    <div data-contact-reveal className={`flex gap-4 ${align === 'start' ? 'items-start' : 'items-center'}`}>
      {icon}
      {children}
    </div>
  )
}

const icon = 'size-6 shrink-0 text-olive'

/**
 * The Contact page's first section, Figma: Desktop - 29 (11102:112858), 1440 × 932. Forest, 130px top
 * and bottom, the 1280 row: on the left (512 wide) the H1, 59px, a white 30% rule, 59px, the contact
 * details; on the right the form card (604, ContactForm), both from the top.
 *
 * Details (Figma 11116:114551): email and phone (24px apart) on the left, the address on the right,
 * each a 24px olive icon 16px from its text. The address opens Google Maps in a new tab.
 *
 * Below 1024 (Figma 11118:115275, 393 × 1275): 100px top and bottom, one column (560 max on tablets).
 * The text 24px from the sides: the H1 (42px, "Get in touch today / and start building / wealth"),
 * 40px, the rule, 40px, the details in one column 24px apart. 64px, then the card, 16px from the sides.
 *
 * From 1024 to about 1250 the row is narrower than 512 + 604: both columns give up width, the card
 * twice as readily (at least 40px apart; the H1 is smaller there anyway, as page-title scales with the
 * screen), and the address drops under email and phone when there isn't room beside them.
 *
 * Text intro on load, About's (introTiming.ts): the H1's lines rise out of their masks one after
 * another, then the rule and the three details fade up in turn. Hidden before first paint, played once
 * the font is in, plain text again afterwards. The card doesn't move. Never with reduced motion.
 *
 * relative z-10: above the footer, which waits under the page for its reveal (as every section does).
 */
export function ContactHero() {
  const { email, phone, addressLines, mapsUrl } = CONTACT_DETAILS
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(INTRO_TEXT_MEDIA, (context) => {
        const title = sectionRef.current!.querySelector<HTMLElement>('#contact-title')!
        const rest = gsap.utils.toArray<HTMLElement>('[data-contact-reveal]', sectionRef.current)
        const text = [title, ...rest]
        // Opacity, not visibility, so screen readers still have the text while it's hidden.
        gsap.set(text, { opacity: 0 })

        let split: SplitText | undefined
        let cancelled = false
        const play = context.add('play', () => {
          if (cancelled) return
          const reveal = revealLines(title, {
            from: { yPercent: I.heading.yPercent },
            mask: true,
            className: 'intro-line',
            duration: I.heading.duration,
            ease: I.heading.ease,
            stagger: I.heading.stagger,
          })
          split = reveal.split
          gsap.set(title, { opacity: 1 })
          const P = I.paragraphs
          gsap
            .timeline({
              delay: I.delay,
              onComplete: () => {
                split?.revert()
                gsap.set(text, { clearProps: 'opacity,transform,translate,rotate,scale' })
              },
            })
            .add(reveal.tween, 0)
            .fromTo(rest, { opacity: 0, y: P.y }, { opacity: 1, y: 0, duration: P.duration, ease: P.ease, stagger: P.stagger }, P.at)
        }) as () => void
        Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, I.fontTimeoutMs))]).then(() => play())

        return () => {
          cancelled = true
          split?.revert()
          gsap.set(text, { clearProps: 'opacity,transform,translate' })
        }
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} aria-labelledby="contact-title" className="relative z-10 bg-forest py-[130px] max-lg:py-[100px]">
      <div className="page-row flex items-start justify-between gap-10 max-lg:max-w-[560px] max-lg:flex-col max-lg:items-stretch max-lg:gap-16 max-lg:px-4">
        <div className="flex w-[512px] flex-col gap-[59px] max-lg:w-auto max-lg:gap-10 max-lg:px-2">
          {/* "Get in touch / today and start / building wealth": three lines at 512. */}
          {/* The line masks widened (as on About) so descenders aren't cut while the lines rise. */}
          <h1
            id="contact-title"
            className="text-page-title text-white [&_.intro-line-mask]:overflow-visible! [&_.intro-line-mask]:[clip-path:inset(-0.2em_-0.15em_-0.25em)]"
          >
            <span className="text-olive">Get in touch</span> today and start building wealth
          </h1>
          {/* Figma's 0-tall line draws its pixel above its y, so this one sits a pixel up too. */}
          <hr data-contact-reveal className="-mt-px border-0 border-t border-white/30" />
          <div className="flex flex-wrap justify-between gap-6 max-lg:flex-col">
            <div className="flex flex-col gap-6">
              <Detail icon={<MailIcon className={icon} />}>
                <a href={`mailto:${email}`} className={link}>
                  {email}
                </a>
              </Detail>
              <Detail icon={<PhoneIcon className={icon} />}>
                <a href={`tel:${phone.tel}`} className={link}>
                  {phone.display}
                </a>
              </Detail>
            </div>
            <Detail icon={<LocationIcon className={icon} />} align="start">
              <address className="text-footer-link not-italic">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={link}>
                  {addressLines.map((line, i) => (
                    <span key={line}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                  <span className="sr-only"> (opens Google Maps in a new tab)</span>
                </a>
              </address>
            </Detail>
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  )
}
