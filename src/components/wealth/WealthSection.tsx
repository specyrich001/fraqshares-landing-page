import discountIcon from '../../assets/icons/discount-shape.svg'
import bellIcon from '../../assets/icons/notification-bing.svg'
import images from '../../generated/images.json'
import { ProductPill } from '../product/ProductPill.tsx'
import { ScaledArtboard } from '../ScaledArtboard.tsx'
import { TransactionCard } from '../product/TransactionCard.tsx'
import { wealthPhoto } from './wealthPhoto.ts'

const photo = wealthPhoto
const thumb = images['wealth/card-thumb']
const bottomBlur = images['wealth/bottom-blur']
const bottomBlurMobile = images['wealth/bottom-blur-mobile']

/*
 * Card stack, inside the 473 × 649 image block. Both cards are the 306px base TransactionCard
 * scaled from their centres (Figma: 1.3036 front, 1.2093 back; every Figma value divides back to
 * the base recipe). Each is placed by its centre so the rendered box lands on Figma's:
 *   front 399 × 96.97 at (37.5, 485)   → centre (237, 533.49), base height 74.39
 *   back  370 × 74.01 at (51.94, 527)  → centre (237, 564.00), base height 61.2
 * left 84px = 237 − 306 / 2. The back card is first so the front one covers it, leaving ~19px peeking.
 */
const cardPlacement = 'absolute left-[84px] -translate-y-1/2'

/**
 * Figma: Desktop - 12 (10800:25226), 1440 × 909. Static layout; the hero → section scroll
 * transition will animate into exactly this state.
 *
 * Mobile, below 1024px (Figma 11004:15513, 393 × 857): one centred 313px column (40px sides), 50px
 * apart: the H2 (287 wide), the image block as a scaled artboard (473 × 649 → 313 wide, ×0.662, the
 * desktop composition untouched), the paragraph (282 wide). 100px above, 96 below. Figma's own
 * 393 × 200 render of the bottom blur. Tablets cap the column at 560px (the image stops at 473).
 */
export function WealthSection() {
  return (
    <section
      id="build-wealth"
      aria-labelledby="build-wealth-title"
      // Pinned behind the hero (HeroWealthStage), it must be at least as tall as the hero (the viewport),
      // or the stage clips the hero and leaves a band below it; the row centres in any extra height.
      // Mobile: it fills the screen (svh: with the browser's bars showing) with the column centred and
      // only 16px kept above and below, so the pinned composition sits centred on any phone; on a screen
      // too short even for that, the stage pins bottom-aligned (HeroWealthStage).
      className="relative min-h-[909px] overflow-hidden bg-white max-lg:min-h-0 group-data-staged/stage:flex max-lg:group-data-staged/stage:min-h-svh group-data-staged/stage:min-h-[max(909px,100svh)] group-data-staged/stage:flex-col group-data-staged/stage:justify-center"
    >
      {/* Figma's render of its blur layer (10806:75658) on white: y 552 → bottom, full width. */}
      <picture>
        <source media="(max-width: 1023px)" srcSet={`${bottomBlurMobile.src} 1x, ${bottomBlurMobile.src2x} 2x`} />
        <img
          src={bottomBlur.src}
          width={bottomBlur.width}
          height={bottomBlur.height}
          alt=""
          loading="lazy"
          data-wealth-blur
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[357px] w-full max-lg:h-[200px]"
        />
      </picture>

      {/* 1280 row, 130px above and below the 649px image = 909. Figma spreads the three columns with
          justify-between (102.5px gaps), which puts the image's centre at x 739.5, not the page centre. */}
      <div className="page-row relative flex items-center justify-between py-[130px] max-xl:flex-col max-xl:items-start max-xl:gap-12 max-lg:max-w-[560px] max-lg:items-center max-lg:gap-[50px] max-lg:px-10 max-lg:pt-[100px] max-lg:pb-[96px] max-lg:group-data-staged/stage:py-4">
        <h2
          id="build-wealth-title"
          data-wealth-heading
          className="w-[320px] max-w-full shrink-0 text-section-h2 leading-none text-strong max-lg:w-[287px] max-lg:text-center max-lg:text-section-h2-mobile"
        >
          <span className="text-muted">Build wealth,</span> <span>one share at a time</span>
        </h2>

        {/* Pinned on a short screen (an iPhone 14 in Safari is 390 × 664), the photo block shrinks so
            the column fits: 262px of heading, gaps, paragraph and padding, then 473 × 649. */}
        <ScaledArtboard width={473} height={649} className="shrink-0 max-lg:group-data-staged/stage:[--artboard-fit:calc((100svh-262px)*473/649)]">
          <div data-wealth-slot className="relative h-[649px] w-[473px] max-w-full shrink-0 overflow-hidden max-lg:max-w-none">
            <img
              src={photo.src}
              srcSet={photo.srcset}
              sizes="473px"
              width={photo.width}
              height={photo.height}
              alt=""
              loading="lazy"
              data-wealth-photo
              className="absolute inset-0 size-full object-cover"
            />

            {/* z-30: stays above the hero layer while the scroll transition runs (no effect when static). */}
            <div aria-hidden="true" data-wealth-overlays className="product-ui absolute inset-0 z-30">
              <ProductPill
                data-wealth-pill
                icon={bellIcon}
                label="Investment opportunities"
                className="absolute top-12 left-[37.5px]"
              />

              {/* Figma "background blur 51" = CSS 25.5px; the card's scale takes it to the 30.86px Figma renders. */}
              <TransactionCard
                data-wealth-card="back"
                media={<img src={discountIcon} width={32} height={32} alt="" className="shrink-0" />}
                title="Interest for August"
                meta="Dividend"
                amount="+₦250,000"
                amountClassName="product-amount-lg text-money-in"
                surfaceClassName="bg-white/30 backdrop-blur-[25.5px] opacity-64"
                paddingClassName="h-[61.2px] px-4"
                className={`${cardPlacement} top-[564px] scale-[1.2093]`}
              />
              <TransactionCard
                data-wealth-card="front"
                media={
                  <img
                    src={thumb.src}
                    srcSet={thumb.srcset}
                    sizes="64px"
                    width={thumb.width}
                    height={thumb.height}
                    alt=""
                    loading="lazy"
                    className="size-[49.1px] shrink-0 object-cover"
                  />
                }
                title="New business added to portfolio"
                meta="Investment update"
                surfaceClassName="bg-white/90"
                paddingClassName="h-[74.39px] pr-4 pl-[11.87px]"
                gapClassName="gap-[11.08px]"
                className={`${cardPlacement} top-[533.49px] scale-[1.3036]`}
              />
            </div>
          </div>
        </ScaledArtboard>

        <p data-wealth-paragraph className="w-[282px] max-w-full shrink-0 text-intro-body text-secondary max-lg:text-center max-lg:text-intro-body-mobile">
          Own shares in real estate, land, and businesses with Fraqshares.
        </p>
      </div>
    </section>
  )
}
