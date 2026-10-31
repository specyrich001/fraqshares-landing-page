import { TransactionCard } from './TransactionCard.tsx'
import './product-type.css'

type Image = { src: string; srcset?: string; width: number; height: number }

type Props = {
  /** The front card's 64px thumbnail (rendered size). */
  thumbnail: Image
  title: string
  meta: string
  /** The back card: its 32px icon (an SVG URL) and amount. Its title and meta are mostly hidden. */
  backIcon: string
  backAmount: string
  backTitle?: string
  backMeta?: string
  /** The back card's own opacity (the element's, so its blur fades with it). */
  backOpacityClassName?: string
  frontSurfaceClassName?: string
  /** Extra attributes for each card element, e.g. data hooks a page's animation targets. */
  frontAttrs?: Record<string, string>
  backAttrs?: Record<string, string>
  /** Places the stack: a 399 × 116 box, the front card's top left. */
  className?: string
}

/*
 * Two base TransactionCards (306px) scaled from their centres, so the type stays on the style guide's
 * sizes (Figma: ×1.3036 front, ×1.2093 back; every Figma value divides back to the base recipe):
 *   front 399 × 96.97 at (0, 0)         → centre (199.5, 48.49), base height 74.39
 *   back  370 × 74.01 at (14.44, 41.99) → centre (199.5, 79.00), base height 61.2
 * left 46.5 = 199.5 − 306 / 2. The back card comes first so the front one covers it, leaving ~19px
 * peeking below. Placement and scale live on a wrapper per card, so an animation can transform the
 * card itself (GSAP folds an element's own translate / scale into its transform).
 */
const wrapper = 'absolute left-[46.5px] -translate-y-1/2'

/**
 * The notification card stack laid on photos: homepage section 2 (Figma 10800:25226) and About
 * section 5 (Figma 11065:45044). Decorative (aria-hidden). Each card carries data-stack-card
 * ("front" / "back"), the thumbnail data-stack-thumb and the back card's amount data-tx-amount.
 */
export function CardStack({
  thumbnail,
  title,
  meta,
  backIcon,
  backAmount,
  backTitle = 'Interest for August',
  backMeta = 'Dividend',
  backOpacityClassName = 'opacity-64',
  frontSurfaceClassName = 'bg-white',
  frontAttrs,
  backAttrs,
  className = '',
}: Props) {
  return (
    <div aria-hidden="true" className={`product-ui absolute h-[116px] w-[399px] ${className}`}>
      {/* Figma "background blur 51" (61.7 at this size) = CSS 25.5px; the card's scale takes it to the
          30.86px Figma renders. */}
      <div className={`${wrapper} top-[79px] scale-[1.2093]`}>
        <TransactionCard
          {...backAttrs}
          data-stack-card="back"
          media={<img src={backIcon} width={32} height={32} alt="" className="shrink-0" />}
          title={backTitle}
          meta={backMeta}
          amount={backAmount}
          amountClassName="product-amount-lg text-money-in"
          surfaceClassName={`bg-white/30 backdrop-blur-[25.5px] ${backOpacityClassName}`}
          paddingClassName="h-[61.2px] px-4"
        />
      </div>
      <div className={`${wrapper} top-[48.49px] scale-[1.3036]`}>
        <TransactionCard
          {...frontAttrs}
          data-stack-card="front"
          media={
            <img
              data-stack-thumb
              src={thumbnail.src}
              srcSet={thumbnail.srcset}
              sizes="64px"
              width={thumbnail.width}
              height={thumbnail.height}
              alt=""
              loading="lazy"
              className="size-[49.1px] shrink-0 object-cover"
            />
          }
          title={title}
          meta={meta}
          surfaceClassName={frontSurfaceClassName}
          paddingClassName="h-[74.39px] pr-4 pl-[11.87px]"
          gapClassName="gap-[11.08px]"
        />
      </div>
    </div>
  )
}
