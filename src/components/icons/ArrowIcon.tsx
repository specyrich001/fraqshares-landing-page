// vuesax/twotone/arrow-left and arrow-right (Figma 11004:15645, 11004:15660): the plain arrows, no circle.
// Strokes use currentColor so the icon follows its button's text colour; the shaft is the twotone 40%.
type Props = { direction: 'left' | 'right'; className?: string }

export function ArrowIcon({ direction, className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {direction === 'left' ? (
        <>
          <path d="M9.57 5.93L3.5 12L9.57 18.07" />
          <path opacity="0.4" d="M20.5 12H3.67" />
        </>
      ) : (
        <>
          <path d="M14.43 5.93L20.5 12L14.43 18.07" />
          <path opacity="0.4" d="M3.5 12H20.33" />
        </>
      )}
    </svg>
  )
}
