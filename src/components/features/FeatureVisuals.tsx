import type { ReactNode } from 'react'
import images from '../../generated/images.json'
import '../product/product-type.css'
import { ScaledArtboard } from '../ScaledArtboard.tsx'

/*
 * The 537 × 490 card visual frame shared by the four cards (Figma 10801:25312 / 10971:74813). Each card
 * animates and lives in its own file (FractionalVisual, PortfolioVisual, RealEstateVisual, VerifiedVisual).
 * Coordinates are rendered px inside the visual; overlays are aria-hidden product UI. Below 1024px the
 * frame is a scaled artboard (537 → the card's 320px, ×0.596), so overlays and animations are unchanged.
 */

const greenBlur = images['shared/green-blur']

/** Base colour + the shared blur (original, not a render) at Figma's 3456 × 1257 from (−768, −28). */
const gradientBackground = (base: string) => ({
  backgroundColor: base,
  backgroundImage: `url(${greenBlur.src})`,
  backgroundSize: '3456px 1257px',
  backgroundPosition: '-768px -28px',
  backgroundRepeat: 'no-repeat',
})

/** What the carousel passes each visual: is this copy the active card, and is its timer running. */
export type VisualProps = { active?: boolean; playing?: boolean }

/** The 537 × 490 frame; overlays go in an aria-hidden product-ui layer. */
export function Visual({ background, children }: { background?: string; children: ReactNode }) {
  return (
    <ScaledArtboard width={537} height={490}>
      <div
        data-feature-visual
        className="relative h-[490px] w-[537px] max-w-full shrink-0 overflow-hidden max-lg:max-w-none"
        style={background ? gradientBackground(background) : undefined}
      >
        <div aria-hidden="true" className="product-ui absolute inset-0">
          {children}
        </div>
      </div>
    </ScaledArtboard>
  )
}
