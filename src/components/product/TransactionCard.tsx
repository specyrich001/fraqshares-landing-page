import type { HTMLAttributes, ReactNode } from 'react'
import './product-type.css'

type Props = {
  /** 32px icon or a thumbnail. */
  media: ReactNode
  title: string
  meta: string
  amount?: string
  /** Type role + colour for the amount, e.g. 'product-amount text-money-in'. */
  amountClassName?: string
  /** Defaults are the base recipe: white, 14px 16px, 8px between media and text, 306px wide. */
  surfaceClassName?: string
  paddingClassName?: string
  gapClassName?: string
  widthClassName?: string
  /** E.g. a max-width where the design truncates the title earlier than the card would. */
  titleClassName?: string
} & HTMLAttributes<HTMLDivElement>

/**
 * Base product card: 306px wide, title Bold 12 / meta Light 10, shadow 0 4 34 25%.
 * Larger appearances scale the whole card with transform (see product-type.css), so the
 * type stays on the style guide's sizes. Must sit inside a .product-ui wrapper.
 */
export function TransactionCard({
  media,
  title,
  meta,
  amount,
  amountClassName = '',
  surfaceClassName = 'bg-white',
  paddingClassName = 'px-4 py-3.5',
  gapClassName = 'gap-2',
  widthClassName = 'w-[306px]',
  titleClassName = '',
  className = '',
  ...rest
}: Props) {
  return (
    <div
      {...rest}
      className={`flex ${widthClassName} items-center gap-3 shadow-[0_4px_34px_rgba(0,0,0,0.25)] ${surfaceClassName} ${paddingClassName} ${className}`}
    >
      <div className={`flex min-w-0 flex-1 items-center ${gapClassName}`}>
        {media}
        <div className="flex min-w-0 flex-col gap-0.5">
          {/* Long titles truncate (cut off in the design). */}
          <p className={`product-title truncate text-black ${titleClassName}`}>{title}</p>
          <p className="product-detail text-meta">{meta}</p>
        </div>
      </div>
      {amount && <p className={`shrink-0 ${amountClassName}`}>{amount}</p>}
    </div>
  )
}
