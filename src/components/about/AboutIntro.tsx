import { ExpandingPhoto } from './ExpandingPhoto.tsx'

/**
 * About section 1, Figma: Desktop - 20 (11049:449), 1440 × 1225, directly under the header.
 * 130px top and bottom, the 1280 row; the intro row (H1 left, paragraphs right, centred against each
 * other) and 100px under it the photo, which opens to the full window width on scroll.
 *
 * Bottom padding is measured from the photo's 1280 × 628 box. Fully open, the photo reaches ~39px
 * further up and down (at 1440), so the gaps become ~61px above it and ~91px below.
 *
 * relative z-10 + white: the footer reveal slides it up off the footer (SiteFooter), as the FAQ does
 * on the home page. Desktop only so far: below 1024 the row just stacks.
 */
export function AboutIntro() {
  return (
    <section aria-labelledby="about-title" className="relative z-10 bg-white py-[130px]">
      <div className="page-row">
        <div className="flex items-center justify-between gap-10 max-lg:flex-col max-lg:items-start">
          {/* One element, two tones: "Building wealth / should have a smaller / starting point." The break
              is explicit: Chrome sets "Building wealth should" 695px wide, so it would fit the 698 box. */}
          <h1 id="about-title" className="w-[698px] max-w-full text-page-title text-strong">
            <span className="text-muted">Building wealth</span>
            <br /> should have a smaller starting point.
          </h1>
          {/* Figma separates the two with an empty 18px line: one line height (1.4em, 25.2px).
              Figma's box is 414, but Chrome sets "…you can own a share of an" 415.25px wide and would wrap
              "an"; 416 with the 2px hung into the gutter keeps Figma's lines and its left edge (x 946). */}
          <div className="-mr-0.5 w-[416px] max-w-full shrink-0 text-intro-body-tight text-body-muted [&>p+p]:mt-[1.4em]">
            <p>
              Fraqshares makes ownership in real estate, land, and businesses more accessible to Africans at home
              and abroad.
            </p>
            <p>
              Through fractional investing, you can own a share of an asset without covering its full purchase
              price or taking on its day-to-day management.
            </p>
          </div>
        </div>

        <ExpandingPhoto className="mt-[100px]" />
      </div>
    </section>
  )
}
