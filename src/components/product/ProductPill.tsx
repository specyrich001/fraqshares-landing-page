import type { HTMLAttributes } from 'react'
import './product-type.css'

type Props = {
  /** 20px white icon on the olive tile. */
  icon: string
  label: string
} & HTMLAttributes<HTMLDivElement>

/**
 * Base product pill: 36px olive icon tile + 8px + white 36px label (Bold 12), shadow 0 4 34 25%.
 * Larger appearances scale the whole pill with transform (see product-type.css). Must sit inside
 * a .product-ui wrapper.
 */
export function ProductPill({ icon, label, className = '', ...rest }: Props) {
  const shadow = 'shadow-[0_4px_34px_rgba(0,0,0,0.25)]'
  return (
    <div {...rest} className={`flex gap-2 ${className}`}>
      <div className={`size-9 bg-olive p-2 ${shadow}`}>
        <img src={icon} width={20} height={20} alt="" className="block" />
      </div>
      <div className={`flex h-9 items-center bg-white px-4 ${shadow}`}>
        {/* Figma trims the text box to cap height; browsers without text-box fall back to 140% line height. */}
        <p className="product-title text-black [text-box:trim-both_cap_alphabetic]">{label}</p>
      </div>
    </div>
  )
}
