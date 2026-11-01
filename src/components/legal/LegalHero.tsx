import { useRef } from 'react'
import type { LegalDocument } from '../../content/legal/types.ts'
import { useTextIntro } from '../useTextIntro.ts'

/**
 * A legal page's first section, Figma: Privacy policy Desktop - 27 (11126:116105), Terms and conditions
 * Desktop - 26 (11121:115581), both 1440 × 418. Forest: the H1 (olive, then white; 611 wide), 17px,
 * "Last Updated: December, 2024" (white 70%, the date bold), on the left. Figma places the text 170px
 * from the top and 128 from the bottom.
 *
 * Below 1024 (no mobile frame; as the Contact hero): 100px top and bottom, 24px sides, 560 max on
 * tablets, and the text centred.
 *
 * Text intro on load (useTextIntro): the H1's lines rise, then the date fades up.
 */
export function LegalHero({ document: { id, title, updated } }: { document: LegalDocument }) {
  const sectionRef = useRef<HTMLElement>(null)

  useTextIntro(sectionRef, `#${id}`, '[data-legal-reveal]')

  return (
    <section ref={sectionRef} aria-labelledby={id} className="relative z-10 bg-forest pt-[170px] pb-[128px] max-lg:py-[100px]">
      <div className="page-row flex flex-col gap-[17px] max-lg:max-w-[560px] max-lg:items-center max-lg:text-center max-lg:px-6">
        <h1
          id={id}
          className="w-[611px] max-w-full text-page-title text-white [&_.intro-line-mask]:overflow-visible! [&_.intro-line-mask]:[clip-path:inset(-0.2em_-0.15em_-0.25em)]"
        >
          <span className="text-olive">{title[0]}</span> {title[1]}
        </h1>
        <p data-legal-reveal className="text-intro-body-tight text-white/70">
          Last Updated:{' '}
          <time dateTime={updated.dateTime} className="font-bold">
            {updated.label}
          </time>
        </p>
      </div>
    </section>
  )
}
