import { buttonBase, focusRing, focusRingOnDark } from './linkStyles.ts'
import { Logo } from './Logo.tsx'

// Section anchors are placeholders until those sections exist.
const links = [
  { label: 'About', href: '#about' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Learn', href: '#learn' },
  { label: 'List Property', href: '#list-property' },
]

const button = `${buttonBase} h-10`

// Over the photo: Figma Nav Bar 10799:25076 (white links, white-outline Log In, white Get Started).
// On a solid bar: Figma Nav Bar 10964:74768.
const tones = {
  overlay: {
    logo: 'white',
    link: `text-white decoration-1 underline-offset-4 hover:underline ${focusRingOnDark}`,
    login: `border-white text-white hover:bg-white hover:text-black ${focusRingOnDark}`,
    cta: `bg-white text-black hover:bg-mint ${focusRingOnDark}`,
  },
  solid: {
    logo: 'color',
    link: `text-nav hover:text-strong ${focusRing}`,
    login: `border-black text-black hover:bg-black hover:text-white ${focusRing}`,
    cta: `bg-black text-white hover:bg-forest ${focusRing}`,
  },
} as const

// Figma's overlay nav has a progressive background blur its code export can't express (it reports
// 0px). Fitted against Figma's render: blur(32px) at full strength to ~40px, fading out by the
// header's bottom edge, so the photo meets the hero without a seam.
const overlayBlurMask = {
  maskImage: 'linear-gradient(to bottom, #000 45%, transparent)',
  WebkitMaskImage: 'linear-gradient(to bottom, #000 45%, transparent)',
}

// Not in Figma: a shade so the white logo and links read on the photo's lamp-lit wall. 40% black
// through the header's content (logo 1.75:1 → 4.6:1 median, 3.6:1 at its brightest; "About"
// 4.2:1 → 8.9:1), easing out over 96px and ending 72px below the bar so it has no visible edge.
const overlayShade = {
  background:
    'linear-gradient(to bottom, rgb(0 0 0 / 0.4) 0, rgb(0 0 0 / 0.4) calc(100% - 96px), rgb(0 0 0 / 0.22) calc(100% - 60px), rgb(0 0 0 / 0.08) calc(100% - 30px), transparent 100%)',
}

/**
 * Site header, in normal document flow (not sticky): it scrolls away with the page.
 * `overlay` lays it over the hero (transparent, white logo, blur + shade); without it, it's the
 * plain white Figma bar. Desktop only — below 1440 the side padding eases down and, under lg,
 * the links drop to their own row. Mobile design pending.
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const tone = overlay ? tones.overlay : tones.solid

  return (
    <header className={overlay ? 'absolute inset-x-0 top-0 z-50' : 'relative bg-white'}>
      {overlay && (
        <>
          <div
            aria-hidden="true"
            style={overlayBlurMask}
            className="pointer-events-none absolute inset-0 -z-10 backdrop-blur-[32px]"
          />
          <div
            aria-hidden="true"
            style={overlayShade}
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(100%+72px)]"
          />
        </>
      )}
      {/* min-h + py rather than a fixed height so rows can wrap at zoom. */}
      <div className="page-row flex min-h-22 flex-wrap items-center justify-between gap-x-8 gap-y-4 py-6">
        {/* White over the hero, full colour on the bar. The ring stays forest in both: over the hero
            the logo sits on the photo's light wall, where a white ring would vanish. */}
        <a href="/" aria-label="Fraqshares home" className={`shrink-0 ${focusRing}`}>
          <Logo tone={tone.logo} className="block" />
        </a>

        <nav aria-label="Primary" className="max-lg:order-last max-lg:basis-full">
          <ul className="flex flex-wrap gap-x-10 gap-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`text-nav-link whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none ${tone.link}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 gap-4">
          {/* 17px + 1px border = Figma's 18px inset. Figma centres the stroke on the 80×40 box; CSS keeps it inside. */}
          <a href="#login" className={`${button} border px-[17px] ${tone.login}`}>
            Log In
          </a>
          <a href="#get-started" className={`${button} px-4.5 ${tone.cta}`}>
            Get Started
          </a>
        </div>
      </div>
    </header>
  )
}
