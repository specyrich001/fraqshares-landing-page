import images from '../../generated/images.json'

/*
 * Step graphics 2 and 4 (Figma 10982:213; steps 1, 3 and 5 are SignUpGraphic, ListingsGraphic and DashboardGraphic). Coordinates are px inside
 * the 496 × 588 step frame, read from Figma's absolute bounds. Every image is its own element with a
 * data-step-layer name so the later micro-animations can target it without restructuring.
 * All decorative (alt=""): the step text is the real content.
 */

type Image = (typeof images)['steps/fund-wallet']

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

/** 2. Fund Your Wallet — screen 297 × 468 at (100, 60). */
export function FundWalletGraphic() {
  return <Layer name="fund-wallet" image={images['steps/fund-wallet']} className="top-[60px] left-[100px] h-[468px] w-[297px]" />
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
