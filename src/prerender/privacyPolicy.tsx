import { renderToString } from 'react-dom/server'
import { LegalPage } from '../components/legal/LegalPage.tsx'
import { PRIVACY_POLICY } from '../content/legal/privacyPolicy.ts'

/** Build-time (and dev) render of /privacy-policy, run in Node by vite.config.ts (pagePrerender), so
 *  the text is in the HTML. In the browser the app then renders over it. */
export function renderPage() {
  return renderToString(<LegalPage document={PRIVACY_POLICY} />)
}
