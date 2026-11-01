import { PageIntro } from '../PageIntro.tsx'

/**
 * Glossary intro, Figma: Desktop - 26 (11092:79278), 1440 × 418, directly under the header. #FAFAFA,
 * 130px top and bottom, the 1280 row: "Fractional / Investing Glossary" (595 wide) on the left, the
 * paragraph (414 wide) on the right, centred against each other. No animation for now.
 *
 * Below 1024 (Figma 11107:113048, 393 wide): PageIntro's mobile stack, as on About, 100px top and
 * bottom.
 */
export function GlossaryIntro() {
  return (
    <section aria-labelledby="glossary-title" className="bg-soft py-[130px] max-lg:py-[100px]">
      <div className="page-row max-lg:max-w-[560px] max-lg:px-6">
        <PageIntro
          id="glossary-title"
          muted="Fractional"
          heading="Investing Glossary"
          // Below 1024, 6px past the column on each side (as About's link-cards heading): at 375 the
          // column is 327 and "Investing Glossary" is 331, which would wrap to a third line.
          headingClassName="w-[595px] max-lg:-mx-1.5 max-lg:w-[calc(100%+12px)]! max-lg:max-w-none!"
          copyClassName="w-[414px]"
          paragraphs={[
            'Understand the terms behind real estate, land, and business investing. Whether you’re exploring fractional investment in Nigeria or building your portfolio from abroad, this glossary explains ownership, potential returns, risks, and how selling your shares works.',
          ]}
        />
      </div>
    </section>
  )
}
