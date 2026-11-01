import { renderToString } from 'react-dom/server'
import { LegalPage } from '../components/legal/LegalPage.tsx'
import { TERMS_AND_CONDITIONS } from '../content/legal/termsAndConditions.ts'

/** Build-time (and dev) render of /terms-and-conditions, run in Node by vite.config.ts (pagePrerender), so
 *  the text is in the HTML. In the browser the app then renders over it. */
export function renderPage() {
  return renderToString(<LegalPage document={TERMS_AND_CONDITIONS} />)
}
