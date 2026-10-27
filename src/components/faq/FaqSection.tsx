import { Fragment, useState } from 'react'
import addSquare from '../../assets/icons/add-square.svg'
import minusSquare from '../../assets/icons/minus-square.svg'
import images from '../../generated/images.json'
import { buttonBase, focusRing } from '../linkStyles.ts'
import './faq.css'
import { faqs } from './faqContent.ts'

const glow = images['faq/glow']

/** FAQPage structured data from the same copy as the accordion. `<` escaped so the JSON can't close the script. */
const structuredData = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
}).replace(/</g, '\\u003c')

const divider = <div aria-hidden="true" className="-mt-px border-t border-black/8" />

/**
 * Figma: Desktop - 16 (10810:75864), 1440 × 1472.
 *
 * One item open at a time (the first by default); opening another closes it, and the open one can be
 * closed. Each question is a button in an h3 controlling its answer region. The answer opens with
 * grid rows 0fr → 1fr; the white panel and the plus/minus icons crossfade (faq.css).
 * Dividers take no height (Figma draws its 1px lines in the row above), so items sit 48px apart.
 */
export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      // z-10: slides up over the footer (SiteFooter reveal).
      className="relative z-10 overflow-hidden bg-soft pt-[130px] pb-[178px]"
    >
      {/* The shared green blur, Figma's crop and +0.58 tint baked in (assets-src/faq/glow.derive.json),
          1440 × 357 on the section's bottom edge. Stretches with the width, as Figma's frame does. */}
      <img
        src={glow.src}
        srcSet={glow.srcset}
        sizes="100vw"
        width={glow.width}
        height={glow.height}
        alt=""
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[357px] w-full max-w-none"
      />

      <div className="page-row relative flex flex-col items-center">
        <h2 id="faq-title" className="w-[433px] max-w-full text-center text-section-h2 leading-none text-muted">
          Frequently <span className="text-strong">Asked Questions</span>
        </h2>

        <div className="mt-20 flex w-[651px] max-w-full flex-col gap-6">
          {faqs.map(({ question, answer }, i) => {
            const isOpen = open === i
            const buttonId = `faq-q-${i + 1}`
            const answerId = `faq-a-${i + 1}`
            return (
              <Fragment key={question}>
                {i > 0 && divider}
                <div data-faq-item data-open={isOpen ? '' : undefined}>
                  <h3 className="m-0">
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className={`flex w-full cursor-pointer items-start justify-between gap-2 text-left text-faq-question text-strong ${focusRing}`}
                    >
                      <span>{question}</span>
                      {/* 24px icon, centred on the 28px first line and staying top-right when the question wraps. */}
                      <span aria-hidden="true" className="relative mt-0.5 size-6 shrink-0">
                        <img data-faq-icon="closed" src={addSquare} width={24} height={24} alt="" className="absolute inset-0" />
                        <img data-faq-icon="open" src={minusSquare} width={24} height={24} alt="" className="absolute inset-0" />
                      </span>
                    </button>
                  </h3>
                  <div id={answerId} role="region" aria-labelledby={buttonId} data-faq-answer>
                    <div>
                      <p className="m-0 pt-4 text-faq-answer text-step-body">{answer}</p>
                    </div>
                  </div>
                </div>
              </Fragment>
            )
          })}
          {divider}
        </div>

        <div className="mt-20 flex flex-col items-center gap-10">
          <p className="m-0 w-[522px] max-w-full text-center text-intro-body leading-normal text-black">
            Still Have Questions? We’re here to help you understand how Fraqshares works
          </p>
          {/* Outline button as section 3's, without the arrow. 17px + 1px border = Figma's 18px.
              PLACEHOLDER href: no contact page or anchor exists yet. */}
          <a
            href="#contact"
            className={`${buttonBase} h-13 border border-black px-[17px] text-black hover:bg-black hover:text-white ${focusRing}`}
          >
            Contact Us
          </a>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
    </section>
  )
}
