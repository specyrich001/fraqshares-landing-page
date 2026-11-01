import { PageIntro } from '../PageIntro.tsx'

/**
 * Glossary intro, Figma: Desktop - 26 (11092:79278), 1440 × 418, directly under the header. #FAFAFA,
 * 130px top and bottom, the 1280 row: "Fractional / Investing Glossary" (595 wide) on the left, the
 * paragraph (414 wide) on the right, centred against each other. No animation for now.
 *
 * Below 1024: PageIntro's mobile stack (About's), 100px top and bottom. No Glossary mobile frame yet:
 * FLAGGED for review.
 */
export function GlossaryIntro() {
  return (
    <section aria-labelledby="glossary-title" className="bg-soft py-[130px] max-lg:py-[100px]">
      <div className="page-row max-lg:max-w-[560px] max-lg:px-6">
        <PageIntro
          id="glossary-title"
          muted="Fractional"
          heading="Investing Glossary"
          headingClassName="w-[595px]"
          copyClassName="w-[414px]"
          paragraphs={[
            'Understand the terms behind real estate, land, and business investing. Whether you’re exploring fractional investment in Nigeria or building your portfolio from abroad, this glossary explains ownership, potential returns, risks, and how selling your shares works.',
          ]}
        />
      </div>
    </section>
  )
}
