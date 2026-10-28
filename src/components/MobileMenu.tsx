import { useEffect, useRef, type RefObject } from 'react'
import { buttonBase, focusRing } from './linkStyles.ts'
import { LOGIN_URL, SIGNUP_URL } from './siteLinks.ts'
import { smoothScroll } from '../motion/useSmoothScroll.ts'

export const MOBILE_MENU_ID = 'mobile-menu'

type Link = { label: string; href: string }

const button = `${buttonBase} h-10 flex-1 justify-center text-button-sm`

/**
 * Open mobile nav (Figma 11023:49893, minus its own copy of the bar): a white panel that slides down
 * from under the 80px bar, which stays put; the bar's menu icon turns into the close icon. Links from
 * 152px down (72px below the bar), Log In / Get Started 40px from the bottom.
 * A column rather than Figma's absolute positions, so on a short screen it scrolls instead of
 * overlapping.
 *
 * While open: focus moves to the first link and stays within the header (bar + panel), the page
 * behind is inert and stops scrolling (Lenis too); Esc, the close icon or a link close it, and focus
 * returns to the menu button. 300ms slide; instant with reduced motion.
 */
export function MobileMenu({
  open,
  onClose,
  links,
  top,
  trap,
  returnFocus,
}: {
  open: boolean
  onClose: () => void
  links: Link[]
  /** The bar's bottom edge on screen when the menu opened: the panel starts here. */
  top: number
  /** Focus stays inside this (the header: bar and panel). */
  trap: RefObject<HTMLElement | null>
  returnFocus: RefObject<HTMLButtonElement | null>
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const container = trap.current!
    const menuButton = returnFocus.current
    const root = document.documentElement
    const behind = [...document.querySelectorAll<HTMLElement>('main, footer')]
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    smoothScroll()?.stop()
    behind.forEach((el) => (el.inert = true))
    panelRef.current?.querySelector<HTMLElement>('a[href]')?.focus()

    const focusables = () =>
      [...container.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter((el) => el.offsetParent !== null)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      root.style.overflow = previousOverflow
      smoothScroll()?.start()
      behind.forEach((el) => (el.inert = false))
      menuButton?.focus()
    }
  }, [open, onClose, trap, returnFocus])

  return (
    // The clip: from the bar's bottom edge down. The panel slides inside it, so it comes out from
    // under the bar. Closed: hidden from everyone once the slide back up has finished.
    <div
      id={MOBILE_MENU_ID}
      style={{ top }}
      className={`fixed inset-x-0 bottom-0 z-40 overflow-hidden motion-reduce:transition-none lg:hidden ${open ? 'visible' : 'invisible transition-[visibility] duration-300'}`}
    >
      <div
        ref={panelRef}
        className={`flex h-full flex-col overflow-y-auto bg-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <nav aria-label="Primary" className="shrink-0 px-6 pt-[72px]">
          <ul className="flex flex-col items-start gap-10">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={onClose} className={`text-nav-link-mobile text-nav hover:text-strong ${focusRing}`}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto flex shrink-0 gap-4 px-6 pt-10 pb-10">
          {/* 17px + 1px border = Figma's 18px inset. */}
          <a href={LOGIN_URL} onClick={onClose} className={`${button} border border-black px-[17px] text-black hover:bg-black hover:text-white ${focusRing}`}>
            Log In
          </a>
          <a href={SIGNUP_URL} onClick={onClose} className={`${button} bg-black px-4.5 text-white hover:bg-forest ${focusRing}`}>
            Get Started
          </a>
        </div>
      </div>
    </div>
  )
}
