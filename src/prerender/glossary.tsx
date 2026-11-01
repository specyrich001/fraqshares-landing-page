import { renderToString } from 'react-dom/server'
import { GlossaryPage } from '../components/glossary/GlossaryPage.tsx'
import { assertValidGlossary, getGlossary } from '../content/glossary/index.ts'

/**
 * Build-time (and dev) render of /glossary, run in Node by vite.config.ts (glossaryPrerender): the
 * page's HTML with no filters, so every term is in the document without JS, and its DefinedTermSet
 * structured data, both from the same data as the page. In the browser the app then renders over it.
 */

export { assertValidGlossary }

/** Inside <script>: no "</script>" (or any "<") can end it early. */
const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')

/** schema.org DefinedTermSet + DefinedTerm, one per term, each pointing at its anchor. */
export function glossaryStructuredData(siteUrl: string) {
  const { terms } = getGlossary()
  const page = `${siteUrl}/glossary`
  const set = `${page}#glossary`
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': set,
    name: 'Fractional Investing Glossary',
    url: page,
    hasDefinedTerm: terms.map((t) => ({
      '@type': 'DefinedTerm',
      '@id': `${page}#${t.slug}`,
      name: t.term,
      description: t.definition.map((b) => b.text).join(' '),
      url: `${page}#${t.slug}`,
      inDefinedTermSet: set,
    })),
  }
}

export function renderGlossary(siteUrl: string) {
  return {
    html: renderToString(<GlossaryPage />),
    jsonLd: safeJson(glossaryStructuredData(siteUrl)),
  }
}
