import cursorIcon from '../../assets/icons/step-cursor.svg'
import images from '../../generated/images.json'

/*
 * The five step graphics (Figma 10805:25442 step 1, 10982:213 steps 2–5). Coordinates are px inside
 * the 496 × 588 step frame, read from Figma's absolute bounds. Every image is its own element with a
 * data-step-layer name so the later micro-animations can target it without restructuring.
 * All decorative (alt=""): the step text is the real content.
 */

type Image = (typeof images)['steps/sign-up']

function Layer({ image, name, className }: { image: Image; name: string; className: string }) {
  return (
    <img
      data-step-layer={name}
      src={image.src}
      srcSet={image.srcset}
      sizes={`${image.width}px`}
      width={image.width}
      height={image.height}
      alt=""
      loading="lazy"
      decoding="async"
      className={`absolute max-w-none object-cover ${className}`}
    />
  )
}

/**
 * Figma "Polygon 4": a 27.56 × 31.03 pointer rotated 30°, in a 39.38 × 40.65 box. The SVG carries
 * its drop shadow, so it bleeds past the pointer by Figma's export insets.
 */
function Cursor({ className }: { className: string }) {
  return (
    <div data-step-layer="cursor" className={`absolute flex h-[40.651px] w-[39.382px] items-center justify-center ${className}`}>
      <div className="relative h-[31.028px] w-[27.56px] -rotate-30">
        <div className="absolute inset-[-50.96%_-73.71%_-75.13%_-73.71%]">
          <img src={cursorIcon} width={68} height={70} alt="" className="block size-full max-w-none" />
        </div>
      </div>
    </div>
  )
}

/** 1. Sign Up — screen 321 × 462 at (88, 63). */
export function SignUpGraphic() {
  return <Layer name="sign-up" image={images['steps/sign-up']} className="top-[63px] left-[88px] h-[462px] w-[321px]" />
}

/** 2. Fund Your Wallet — screen 297 × 468 at (100, 60). */
export function FundWalletGraphic() {
  return <Layer name="fund-wallet" image={images['steps/fund-wallet']} className="top-[60px] left-[100px] h-[468px] w-[297px]" />
}

/** 3. Browse Available Listings — centre card, side cards at 50% clipped by the frame, pointer. */
export function ListingsGraphic() {
  return (
    <>
      <Layer name="listing-left" image={images['steps/listing-left']} className="top-[167.226px] left-[-190.621px] h-[253px] w-[252px] opacity-50" />
      <Layer name="listing-center" image={images['steps/listing-center']} className="top-[140.73px] left-[96px] h-[305.99px] w-[305px]" />
      <Layer name="listing-right" image={images['steps/listing-right']} className="top-[167.226px] left-[435.621px] h-[253px] w-[252px] opacity-50" />
      <Cursor className="top-[412px] left-[358px]" />
    </>
  )
}

/**
 * 4. Buy Units — Figma also stacks the listing being bought above the buy screen, with a 20% white
 * ghost card peeking behind it (not in the written spec; built to Figma).
 */
export function BuyUnitsGraphic() {
  return (
    <>
      <div data-step-layer="buy-ghost" className="absolute top-[52px] left-[130.385px] h-[57.117px] w-[234.538px] bg-white/20" />
      <Layer name="buy-listing" image={images['steps/buy-listing']} className="top-[64.52px] left-[120px] h-[62.309px] w-[255.309px]" />
      <Layer name="buy-units" image={images['steps/buy-units']} className="top-[142.829px] left-[120px] h-[392.854px] w-[255.309px]" />
    </>
  )
}

/** 5. Monitor & Manage Portfolio — largest card in front, the smaller two recede behind it; pointer. */
export function DashboardGraphic() {
  return (
    <>
      <Layer name="dashboard-back" image={images['steps/dashboard-back']} className="top-[271px] left-[99px] h-[156.036px] w-[299px]" />
      <Layer
        name="dashboard-middle"
        image={images['steps/dashboard-middle']}
        className="top-[226px] left-[85px] h-[171px] w-[327px] shadow-[0_4px_34px_rgba(0,0,0,0.15)]"
      />
      <Layer
        name="dashboard-front"
        image={images['steps/dashboard-front']}
        className="top-[161px] left-[65.5px] h-[191px] w-[366px] shadow-[0_4px_34px_rgba(0,0,0,0.12)]"
      />
      <Cursor className="top-[290px] left-[408px]" />
    </>
  )
}
