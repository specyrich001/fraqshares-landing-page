import cursorIcon from '../../assets/icons/step-cursor.svg'

/**
 * The step pointer as a point at its tip: Figma "Polygon 4", a 27.56 × 31.03 pointer rotated 30°.
 * The SVG carries its drop shadow; its tip sits at (34.1, 18) in the SVG, so the outer element is
 * the tip and the pointer (data-cursor-pointer) scales about it. Place it with `className` (left/top
 * at the tip) or move it with transforms.
 */
export function StepCursor({ className = '', ...data }: { className?: string } & Record<`data-${string}`, string | boolean>) {
  return (
    <div {...data} className={`pointer-events-none absolute ${className}`}>
      <div data-cursor-pointer className="absolute top-[-18px] left-[-34.1px] h-[70.152px] w-[68.191px] origin-[34.1px_18px] -rotate-30">
        <img src={cursorIcon} width={68} height={70} alt="" className="block size-full max-w-none" />
      </div>
    </div>
  )
}
