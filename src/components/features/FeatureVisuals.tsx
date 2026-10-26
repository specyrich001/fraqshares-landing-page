import type { ReactNode } from 'react'
import briefcaseIcon from '../../assets/icons/briefcase.svg'
import discountIcon from '../../assets/icons/discount-shape.svg'
import flashIcon from '../../assets/icons/flash.svg'
import verifyIcon from '../../assets/icons/verify.svg'
import images from '../../generated/images.json'
import { ProductPill } from '../product/ProductPill.tsx'
import { TransactionCard } from '../product/TransactionCard.tsx'
import '../product/product-type.css'

/*
 * The four 537 × 490 card visuals (Figma 10801:25312 / 10971:74813). Coordinates are rendered px
 * inside the visual. Overlays are aria-hidden product UI; every piece has a data-feature-* hook so
 * the later micro-animations can target it without restructuring.
 */

const greenBlur = images['shared/green-blur']
const land = images['features/land']
const phone = images['features/phone']
const house = images['features/house']
const villa = images['features/villa']
const cars = images['features/cars']

/** Base colour + the shared blur (original, not a render) at Figma's 3456 × 1257 from (−768, −28). */
const gradientBackground = (base: string) => ({
  backgroundColor: base,
  backgroundImage: `url(${greenBlur.src})`,
  backgroundSize: '3456px 1257px',
  backgroundPosition: '-768px -28px',
  backgroundRepeat: 'no-repeat',
})

function Visual({ background, children }: { background?: string; children: ReactNode }) {
  return (
    <div
      data-feature-visual
      className="relative h-[490px] w-[537px] max-w-full shrink-0 overflow-hidden"
      style={background ? gradientBackground(background) : undefined}
    >
      <div aria-hidden="true" className="product-ui absolute inset-0">
        {children}
      </div>
    </div>
  )
}

/** Cards are placed by their rendered centre and scaled from it (origin centre). */
const centred = 'absolute -translate-y-1/2'

/*
 * Card 1 — Fractional Ownership. All three overlays are base product UI scaled:
 *   pill ×1.2303 (36 → 44.29), back card ×1.4877 (= section 2's back card), front card ×1.6038.
 * Shared centre x 314.5 (Figma). Front card: base width 329.84 (Figma: 529 ÷ 1.6038), not 306.
 */
export function FractionalVisual() {
  return (
    <Visual background="var(--color-forest)">
      <ProductPill
        data-feature-pill
        icon={briefcaseIcon}
        label="My Portfolio"
        className="absolute top-[140px] left-[50px] origin-top-left scale-[1.2303]"
      />
      {/* back: rendered 455.2 × 91.05 at (86.91, 259.95) → centre (314.52, 305.48) */}
      <TransactionCard
        data-feature-tx="back"
        media={<img src={discountIcon} width={32} height={32} alt="" className="shrink-0" />}
        title="Interest for August"
        meta="Dividend"
        amount="+₦250,000"
        amountClassName="product-amount-lg text-money-in"
        surfaceClassName="bg-white/30 backdrop-blur-[25.5px] opacity-64"
        paddingClassName="h-[61.2px] px-4"
        className={`${centred} top-[305.48px] left-[161.52px] scale-[1.4877]`}
      />
      {/* front: rendered 529 × 119.33 at (50, 208.29) → centre (314.5, 267.96); runs past the
          visual's right edge and is clipped, as designed */}
      <TransactionCard
        data-feature-tx="front"
        media={
          <img
            src={land.src}
            srcSet={land.srcset}
            sizes="79px"
            width={land.width}
            height={land.height}
            alt=""
            loading="lazy"
            className="size-[49.09px] shrink-0 object-cover"
          />
        }
        title="450SQM Parcel Of Land At Harmony Estate (Plot B)"
        meta="New investment"
        amount="10 Units"
        amountClassName="product-amount text-forest"
        widthClassName="w-[329.84px]"
        paddingClassName="h-[74.41px] pr-4 pl-[11.87px]"
        gapClassName="gap-[13.89px]"
        titleClassName="max-w-[162.74px]"
        className={`${centred} top-[267.96px] left-[149.58px] scale-[1.6038]`}
      />
    </Visual>
  )
}

/** Card 2 — One Portfolio. Phone mockup 290 × 591 at (124, 46), cropped by the visual's bottom. */
export function PortfolioVisual() {
  return (
    <Visual background="var(--color-olive)">
      <img
        data-feature-phone
        src={phone.src}
        srcSet={phone.srcset}
        sizes="290px"
        width={phone.width}
        height={phone.height}
        alt=""
        loading="lazy"
        className="absolute top-[46px] left-[124px] h-[591px] w-[290px] object-cover"
      />
    </Visual>
  )
}

/*
 * Card 3 — Premium Real Estate. Built to Figma's rendered numbers: the front card's padding,
 * gap and meta follow the base card ×1.2093, but its title (16px = 13.2 base) and icon
 * (40px = 33.1 base) don't, so it isn't a scaled TransactionCard. Figma blurs 8.6 / 10 = CSS 4.3 / 5.
 */
export function RealEstateVisual() {
  return (
    <Visual background="var(--color-forest)">
      <img
        data-feature-photo
        src={house.src}
        srcSet={house.srcset}
        sizes="537px"
        width={house.width}
        height={house.height}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
      <div data-feature-stack>
        <div
          data-feature-stack-layer="2"
          className="absolute top-[251px] left-[125.14px] h-[57px] w-[286.73px] bg-white/50 backdrop-blur-[4.318px]"
        />
        <div
          data-feature-stack-layer="1"
          className="absolute top-[230px] left-[103px] h-[66px] w-[332px] bg-white/50 backdrop-blur-[5px]"
        />
        <div
          data-feature-stack-layer="front"
          className="absolute top-[208px] left-[83.98px] flex h-[74.013px] w-[370.04px] items-center gap-[9.674px] bg-white px-[19.348px] shadow-[0_4.837px_51.11px_rgba(0,0,0,0.55)]"
        >
          <img src={flashIcon} width={40} height={40} alt="" className="shrink-0" />
          <div className="flex flex-col gap-[2.419px] leading-[1.4]">
            <p className="text-[16px] font-bold whitespace-nowrap text-black">Top property on the platform</p>
            <p className="text-[12.093px] font-light text-meta">Luxury property</p>
          </div>
        </div>
      </div>
    </Visual>
  )
}

type ListItemProps = { image: typeof villa; title: string; meta: string; item: string }

/** Card 4 list item, to Figma's rendered numbers (title 16.51 = 13.65 base, so not a scaled base card). */
function VerifiedItem({ image, title, meta, item }: ListItemProps) {
  return (
    <div
      data-feature-feed-item={item}
      className="flex h-[107.964px] w-full shrink-0 items-center justify-between bg-white px-3 py-[13.93px]"
    >
      <div className="flex items-center gap-[14px]">
        <img
          src={image.src}
          srcSet={image.srcset}
          sizes="95px"
          width={image.width}
          height={image.height}
          alt=""
          loading="lazy"
          className="h-[80.104px] w-[94.3px] shrink-0 object-cover"
        />
        <div className="flex w-[137.855px] flex-col gap-[2.419px] leading-[1.4]">
          <p className="text-[16.51px] font-bold whitespace-nowrap text-black">{title}</p>
          <p className="text-[12.093px] font-light text-meta">{meta}</p>
        </div>
      </div>
      <img src={verifyIcon} width={28} height={28} alt="" className="shrink-0" />
    </div>
  )
}

/*
 * Card 4 — Verified Assets. A 350px window at (111, 5.07) on a column track (16px gaps, 108px
 * items) with ghost cards at both ends, so items can later scroll/cycle through it as a feed.
 */
export function VerifiedVisual() {
  return (
    <Visual background="var(--color-forest)">
      <div data-feature-feed className="absolute top-[5.07px] left-[111px] h-[479.86px] w-[350px] overflow-hidden">
        <div data-feature-feed-track className="flex flex-col gap-4">
          <div data-feature-feed-item="ghost-top" className="h-[107.964px] w-full shrink-0 bg-linear-to-t from-white/30 to-white/0" />
          <VerifiedItem item="property" image={villa} title="Property Verified" meta="New listed property" />
          <VerifiedItem item="business" image={cars} title="Business Verified" meta="New listed business" />
          <div data-feature-feed-item="ghost-bottom" className="h-[107.964px] w-full shrink-0 bg-linear-to-b from-white/30 to-white/0" />
        </div>
      </div>
    </Visual>
  )
}
