/** A token from tokens.css: once it resolves on :root, the site's stylesheet is applied. */
const PROBE = '--color-strong'
/** Give up waiting after this long and render anyway (a stylesheet that never loads). */
const TIMEOUT_MS = 3000

/**
 * Resolves once the site's stylesheet is applied. Safari can run the module script before the linked
 * CSS has loaded (Chrome waits for it), and the scroll scenes read computed styles when they mount (an
 * opacity, a colour, sizes): unstyled, they'd read the browser's defaults. Seen on /about, whose small
 * bundle wins the race. A pending <link>'s .sheet isn't a reliable signal there (WebKit creates it
 * early), so this checks the CSS itself, once a frame. The page can't paint before its stylesheets
 * anyway, so waiting delays nothing. In dev the CSS is already injected and this resolves at once.
 */
export function stylesReady(): Promise<void> {
  const applied = () => getComputedStyle(document.documentElement).getPropertyValue(PROBE).trim() !== ''
  if (applied()) return Promise.resolve()
  const start = performance.now()
  return new Promise((resolve) => {
    const check = () => (applied() || performance.now() - start > TIMEOUT_MS ? resolve() : requestAnimationFrame(check))
    requestAnimationFrame(check)
  })
}
