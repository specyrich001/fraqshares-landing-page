import { useCallback, useEffect, useRef, useState } from 'react'
import { CloseIcon, MenuIcon } from './icons/MenuIcons.tsx'
import { buttonBase, focusRing, focusRingOnDark } from './linkStyles.ts'
import { Logo } from './Logo.tsx'
import { MOBILE_MENU_ID, MobileMenu } from './MobileMenu.tsx'
import { ABOUT_HREF, currentPath, HOW_IT_WORKS_HREF, LOGIN_URL, SIGNUP_URL } from './siteLinks.ts'

// Learn and List Property are placeholders until those pages exist.
const links = [
  { label: 'About', href: ABOUT_HREF },
  { label: 'How It Works', href: HOW_IT_WORKS_HREF },
  { label: 'Learn', href: '#learn' },
  { label: 'List Property', href: '#list-property' },
]

const button = `${buttonBase} h-10`

/** Where the desktop header starts (Tailwind lg); below it, the mobile bar. */
const DESKTOP_MEDIA = '(min-width: 1024px)'

/** Mobile (Figma 11003:2247): always the full-colour logo, 130 wide, whatever the desktop tone. */
const mobileLogo =
  'max-lg:h-auto max-lg:w-[130px] max-lg:[--logo-wordmark:var(--color-strong)] max-lg:[--logo-mark:var(--color-forest)] max-lg:[--logo-accent:var(--color-olive)]'

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
    // Current page: #111 instead of #606060 (not in Figma; a proposal).
    link: `text-nav decoration-1 underline-offset-4 hover:text-strong hover:underline aria-[current=page]:text-strong ${focusRing}`,
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
 * `overlay` lays it over the hero from 1024px up (transparent, white logo, blur + shade); without
 * it, it's the plain white Figma bar. Below 1440 the side padding eases down.
 *
 * Below 1024px it's the mobile bar (Figma 11003:2247) whatever `overlay` says: 80px, white, in the
 * flow above the hero; the logo and a menu button that slides MobileMenu out from under the bar.
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const tone = overlay ? tones.overlay : tones.solid
  const path = currentPath()
  const current = (href: string) => (href === path ? 'page' : undefined)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuTop, setMenuTop] = useState(80)
  const headerRef = useRef<HTMLElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const toggleMenu = () => {
    // The panel hangs from the bar's bottom edge wherever it is on screen (the page may be scrolled a little).
    if (!menuOpen) setMenuTop(Math.max(0, barRef.current!.getBoundingClientRect().bottom))
    setMenuOpen(!menuOpen)
  }

  // The menu only exists on mobile: close it if the window grows past the breakpoint.
  useEffect(() => {
    if (!menuOpen) return
    const mq = window.matchMedia(DESKTOP_MEDIA)
    const onChange = () => mq.matches && setMenuOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [menuOpen])

  return (
    <header ref={headerRef} className={overlay ? 'relative z-50 bg-white lg:absolute lg:inset-x-0 lg:top-0 lg:bg-transparent' : 'relative bg-white'}>
      {overlay && (
        <>
          <div
            aria-hidden="true"
            style={overlayBlurMask}
            className="pointer-events-none absolute inset-0 -z-10 backdrop-blur-[32px] max-lg:hidden"
          />
          <div
            aria-hidden="true"
            style={overlayShade}
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(100%+72px)] max-lg:hidden"
          />
        </>
      )}
      {/* min-h + py rather than a fixed height so rows can wrap at zoom. Mobile: 80px, 24px sides. */}
      <div
        ref={barRef}
        className="page-row flex min-h-22 flex-wrap items-center justify-between gap-x-8 gap-y-4 py-6 max-lg:min-h-20 max-lg:flex-nowrap max-lg:px-6 max-lg:py-0"
      >
        {/* White over the hero, full colour on the bar. The ring stays forest in both: over the hero
            the logo sits on the photo's light wall, where a white ring would vanish. */}
        <a href="/" aria-label="Fraqshares home" className={`shrink-0 ${focusRing}`}>
          <Logo tone={tone.logo} className={`block ${mobileLogo}`} />
        </a>

        {/* 44px target; the 32px icon sits 24px from the edge, as in Figma. Turns into the close icon
            while the menu is open (Figma 11023:49925). */}
        <button
          ref={menuButton}
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls={MOBILE_MENU_ID}
          onClick={toggleMenu}
          className={`-mr-1.5 grid size-11 place-items-center text-black lg:hidden ${focusRing}`}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <nav aria-label="Primary" className="max-lg:hidden">
          <ul className="flex flex-wrap gap-x-10 gap-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={current(link.href)}
                  className={`text-nav-link whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none ${tone.link}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 gap-4 max-lg:hidden">
          {/* 17px + 1px border = Figma's 18px inset. Figma centres the stroke on the 80×40 box; CSS keeps it inside. */}
          <a href={LOGIN_URL} className={`${button} border px-[17px] ${tone.login}`}>
            Log In
          </a>
          <a href={SIGNUP_URL} className={`${button} px-4.5 ${tone.cta}`}>
            Get Started
          </a>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={closeMenu} links={links} current={path} top={menuTop} trap={headerRef} returnFocus={menuButton} />
    </header>
  )
}
