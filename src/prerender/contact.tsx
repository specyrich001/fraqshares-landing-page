import { renderToString } from 'react-dom/server'
import { ContactPage } from '../components/contact/ContactPage.tsx'

/**
 * Build-time (and dev) render of /contact, run in Node by vite.config.ts (pagePrerender): the page with
 * the empty form, so it can be read and sent without JS. In the browser the app then renders over it.
 * The endpoint's no-JS answers edit this same HTML (src/server/contact/renderPage.ts).
 */
export function renderContact() {
  return renderToString(<ContactPage />)
}
