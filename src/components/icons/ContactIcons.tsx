// The Contact page's icons, from the Figma exports. Drawn in currentColor; the page sets Figma's colours
// (olive for the three detail icons, #061E18 for the tick). Decorative: the text beside them says it all.

type Props = { className?: string }

const stroked = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  'aria-hidden': true,
  focusable: false,
} as const

/** vuesax/twotone/sms-tracking (Figma 11116:114553). */
export function MailIcon({ className }: Props) {
  return (
    <svg {...stroked} strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={10} className={className}>
      <path d="M2 8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5H7" />
      <g opacity="0.4">
        <path d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9" />
        <path d="M2 16.5H8" />
        <path d="M2 12.5H5" />
      </g>
    </svg>
  )
}

/** vuesax/twotone/call-calling (Figma 11116:114556). */
export function PhoneIcon({ className }: Props) {
  return (
    <svg {...stroked} strokeMiterlimit={10} className={className}>
      <path d="M21.97 18.33C21.97 18.69 21.89 19.06 21.72 19.42C21.55 19.78 21.33 20.12 21.04 20.44C20.55 20.98 20.01 21.37 19.4 21.62C18.8 21.87 18.15 22 17.45 22C16.43 22 15.34 21.76 14.19 21.27C13.04 20.78 11.89 20.12 10.75 19.29C9.6 18.45 8.51 17.52 7.47 16.49C6.44 15.45 5.51 14.36 4.68 13.22C3.86 12.08 3.2 10.94 2.72 9.81C2.24 8.67 2 7.58 2 6.54C2 5.86 2.12 5.21 2.36 4.61C2.6 4 2.98 3.44 3.51 2.94C4.15 2.31 4.85 2 5.59 2C5.87 2 6.15 2.06 6.4 2.18C6.66 2.3 6.89 2.48 7.07 2.74L9.39 6.01C9.57 6.26 9.7 6.49 9.79 6.71C9.88 6.92 9.93 7.13 9.93 7.32C9.93 7.56 9.86 7.8 9.72 8.03C9.59 8.26 9.4 8.5 9.16 8.74L8.4 9.53C8.29 9.64 8.24 9.77 8.24 9.93C8.24 10.01 8.25 10.08 8.27 10.16C8.3 10.24 8.33 10.3 8.35 10.36C8.53 10.69 8.84 11.12 9.28 11.64C9.73 12.16 10.21 12.69 10.73 13.22C11.27 13.75 11.79 14.24 12.32 14.69C12.84 15.13 13.27 15.43 13.61 15.61C13.66 15.63 13.72 15.66 13.79 15.69C13.87 15.72 13.95 15.73 14.04 15.73C14.21 15.73 14.34 15.67 14.45 15.56L15.21 14.81C15.46 14.56 15.7 14.37 15.93 14.25C16.16 14.11 16.39 14.04 16.64 14.04C16.83 14.04 17.03 14.08 17.25 14.17C17.47 14.26 17.7 14.39 17.95 14.56L21.26 16.91C21.52 17.09 21.7 17.3 21.81 17.55C21.91 17.8 21.97 18.05 21.97 18.33Z" />
      <g opacity="0.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.5 9C18.5 8.4 18.03 7.48 17.33 6.73C16.69 6.04 15.84 5.5 15 5.5" />
        <path d="M22 9C22 5.13 18.87 2 15 2" />
      </g>
    </svg>
  )
}

/** location (Figma 11116:114599). */
export function LocationIcon({ className }: Props) {
  return (
    <svg {...stroked} className={className}>
      <path
        opacity="0.4"
        d="M15.12 10.31C15.12 12.0331 13.7231 13.43 12 13.43C10.2769 13.43 8.88 12.0331 8.88 10.31C8.88 8.58687 10.2769 7.19 12 7.19C13.7231 7.19 15.12 8.58687 15.12 10.31Z"
      />
      <path d="M3.62 8.49C5.59 -0.17 18.42 -0.16 20.38 8.5C21.53 13.58 18.37 17.88 15.6 20.54C13.59 22.48 10.41 22.48 8.39 20.54C5.63 17.88 2.47 13.57 3.62 8.49Z" />
    </svg>
  )
}

/** vuesax/bold/tick-circle (Figma 11118:115051), 150 × 150 in the success state. */
export function TickCircleIcon({ className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d="M75 12.5C40.5625 12.5 12.5 40.5625 12.5 75C12.5 109.438 40.5625 137.5 75 137.5C109.438 137.5 137.5 109.438 137.5 75C137.5 40.5625 109.438 12.5 75 12.5ZM104.875 60.625L69.4375 96.0625C68.5625 96.9375 67.375 97.4375 66.125 97.4375C64.875 97.4375 63.6875 96.9375 62.8125 96.0625L45.125 78.375C43.3125 76.5625 43.3125 73.5625 45.125 71.75C46.9375 69.9375 49.9375 69.9375 51.75 71.75L66.125 86.125L98.25 54C100.062 52.1875 103.063 52.1875 104.875 54C106.688 55.8125 106.688 58.75 104.875 60.625Z" />
    </svg>
  )
}
