import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import '../components/product/product-type.css'

type Token = {
  role: string
  cls: string
  spec: string
  mobile?: string
  sample: ReactNode
}

const display: Token[] = [
  {
    role: 'hero-h1',
    cls: 'text-hero-h1',
    spec: '72px / 100% / 500 / -4%',
    mobile: '40px @ 375px',
    sample: 'Buy, sell, and own shares in real estate & businesses',
  },
  {
    role: 'section-h2',
    cls: 'text-section-h2',
    spec: '58px / 110% / 500 / -4%',
    mobile: '36px @ 375px',
    sample: 'Build wealth, one share at a time',
  },
  {
    role: 'section-h2 + leading-none',
    cls: 'text-section-h2 leading-none',
    spec: '58px / 100% / 500 / -4% (allowed variant)',
    mobile: '36px @ 375px',
    sample: 'Build wealth, one share at a time',
  },
  {
    role: 'testimonial-intro',
    cls: 'text-testimonial-intro',
    spec: '62px / 100% / 500 / -4%',
    mobile: '38px @ 375px',
    sample: 'Join our pool of investors and start building your portfolio',
  },
  {
    role: 'conversion-headline',
    cls: 'text-conversion-headline',
    spec: '62px / 100% / 700 / -1%',
    mobile: '38px @ 375px',
    sample: 'Own a share. Expand your possibilities.',
  },
]

const reading: Token[] = [
  {
    role: 'intro-body',
    cls: 'text-intro-body',
    spec: '24px / 140% / 400 / -1%',
    sample:
      'Fraqshares is your gateway to fractional ownership. Access shares of premium real estate and businesses, all through one simple platform.',
  },
  {
    role: 'step-title',
    cls: 'text-step-title',
    spec: '24px / 140% / 500 / -1%',
    sample: 'Investing made easy, with just a few taps.',
  },
  {
    role: 'body-main',
    cls: 'text-body-main',
    spec: '20px / 140% / 400 / -1%',
    sample:
      'All it takes is a few taps on your phone to manage your portfolio, earn income, and stay on top of your investments.',
  },
  { role: 'tab', cls: 'text-tab', spec: '20px / 140% / 500 / -1%', sample: 'Real estate' },
  { role: 'faq-question', cls: 'text-faq-question', spec: '= tab', sample: 'What is Fraqshares?' },
  {
    role: 'feature-subtitle',
    cls: 'text-feature-subtitle',
    spec: '20px / 140% / 700 / -1%',
    sample: 'Make diversification your friend',
  },
  {
    role: 'step-description',
    cls: 'text-step-description',
    spec: '18px / 150% / 400 / -1%',
    sample: 'Reduce risk by owning parts of multiple properties instead of just one.',
  },
  {
    role: 'body',
    cls: 'text-body',
    spec: '16px / 150% / 400 / -1%',
    sample:
      'Whether you are just getting started or you are an experienced investor, Fraqshares makes it easy to access the wealth-building power of shared ownership.',
  },
  {
    role: 'faq-answer',
    cls: 'text-faq-answer',
    spec: '= body',
    sample:
      'You don’t need to be a millionaire or have a background in finance. Anyone can invest with Fraqshares.',
  },
  {
    role: 'legal',
    cls: 'text-legal',
    spec: '= body, 400 + 700 inline',
    sample: (
      <>
        By continuing you agree to our <strong className="font-bold">Terms of Service</strong> and{' '}
        <strong className="font-bold">Privacy Policy</strong>. All investments carry risk.
      </>
    ),
  },
  { role: 'nav-link', cls: 'text-nav-link', spec: '16px / 140% / 500 / -2%', sample: 'How it works' },
  { role: 'button', cls: 'text-button', spec: '16px / 125% / 500 / 0', sample: 'Get started' },
  { role: 'footer-heading', cls: 'text-footer-heading', spec: '16px / 140% / 700 / 0', sample: 'Company' },
  { role: 'footer-link', cls: 'text-footer-link', spec: '16px / 140% / 400 / 0', sample: 'About us' },
  { role: 'eyebrow', cls: 'text-eyebrow', spec: '12px / auto / 700 / +4%', sample: 'How it works' },
  { role: 'label', cls: 'text-label', spec: '= eyebrow', sample: 'Annual yield' },
]

// Embedded product type: Ruberoid, for product-UI artwork only (hero feed, section-2 overlays).
// Card-artwork sizes from the style guide, kept out of the site tokens; larger cards scale whole.
const product: Token[] = [
  {
    role: 'product-title',
    cls: 'product-ui product-title',
    spec: 'Ruberoid Bold 700 · 12px / 140% / 0',
    sample: 'New business added to portfolio',
  },
  {
    role: 'product-detail',
    cls: 'product-ui product-detail',
    spec: 'Ruberoid Light 300 · 10px / 140% / 0 (body + meta)',
    sample: 'We have found new properties for you to add to your portfolio.',
  },
  {
    role: 'product-app',
    cls: 'product-ui product-app',
    spec: 'Ruberoid Regular 400 · 10px / normal / 0 · uppercase',
    sample: 'Fraqshares',
  },
  { role: 'product-time', cls: 'product-ui product-time', spec: 'Ruberoid Light 300 · 8px / normal / 0', sample: 'Now' },
  {
    role: 'product-amount',
    cls: 'product-ui product-amount text-money-in',
    spec: 'Ruberoid SemiBold 600 · 10px / normal / 0 · ₦ falls back to DM Sans',
    sample: '+₦250,000',
  },
  {
    role: 'product-amount-lg',
    cls: 'product-ui product-amount-lg text-money-in',
    spec: 'Ruberoid Regular 400 · 12px / normal / 0',
    sample: '+₦250,000',
  },
]

// The licensed kit's 9 weights, each with an oblique (CSS values from product-type.css).
const ruberoidWeights = [
  ['Thin', 100],
  ['UltraLight', 200],
  ['ExtraLight', 250],
  ['Light', 300],
  ['Regular', 400],
  ['Medium', 500],
  ['SemiBold', 600],
  ['Bold', 700],
  ['ExtraBold', 800],
] as const

const colors = [
  { name: 'forest', hex: '#034C3C', note: 'Fraqvest/Color 1 · primary dark' },
  { name: 'olive', hex: '#ABB06D', note: 'Fraqvest/Color 2' },
  { name: 'mint', hex: '#EFF9F0', note: 'Fraqvest/Color 3' },
  { name: 'strong', hex: '#111111', note: '--text-strong' },
  { name: 'muted', hex: '#999999', note: '--text-muted · display sizes only' },
  { name: 'nav', hex: '#606060', note: '--text-nav · header links' },
  { name: 'secondary', hex: '#5E5E5E', note: '--text-secondary · supporting paragraphs' },
  { name: 'meta', hex: '#767676', note: '--text-meta · product-card meta' },
  { name: 'money-in', hex: '#35B705', note: '--money-in · product-card amounts' },
  { name: 'money-out', hex: '#FD2A2A', note: '--money-out · product-card amounts' },
  { name: 'soft', hex: '#FAFAFA', note: '--bg-soft · FAQ section background' },
  { name: 'footer-muted', hex: '#C5C8BA', note: '--text-footer-muted · footer copyright line' },
  { name: 'dark', hex: '#0E1711', note: '--bg-dark · steps section background' },
  { name: 'step-body', hex: '#827979', note: '--text-step-body · step descriptions, on bg-dark' },
  { name: 'indicator-inactive', hex: '#5C5C5C', note: '--indicator-inactive · step indicator' },
  { name: 'indicator-progress', hex: '#F3FF60', note: '--indicator-progress · step indicator fill' },
]

const px = (v: string) => `${+parseFloat(v).toFixed(2)}px`

function useViewportWidth() {
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return width
}

/** What the browser actually resolved, so it can be checked against Figma's inspect panel. */
function Computed({ el, width }: { el: HTMLElement | null; width: number }) {
  const [text, setText] = useState('')
  useLayoutEffect(() => {
    if (!el) return
    const s = getComputedStyle(el)
    const size = parseFloat(s.fontSize)
    const lh = s.lineHeight === 'normal' ? 'normal' : px(s.lineHeight)
    const ls = s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing)
    const pct = +((ls / size) * 100).toFixed(2)
    setText(`${px(s.fontSize)} / ${lh} · ${s.fontWeight} · ${pct}% (${px(String(ls))})`)
  }, [el, width])
  return <p className="font-mono text-body text-forest">{text}</p>
}

function Row({
  token,
  width,
  as: Tag = 'p',
  children,
}: {
  token: Omit<Token, 'sample'>
  width: number
  as?: 'p' | 'h3'
  children: ReactNode
}) {
  // Callback ref into state: the readout renders before the sample, so a plain ref would still be
  // null when its layout effect runs (it never filled in). State re-renders it once attached.
  const [el, setEl] = useState<HTMLElement | null>(null)
  return (
    <div className="grid gap-x-12 gap-y-4 border-t border-strong/10 py-10 lg:grid-cols-[18rem_1fr]">
      <div className="space-y-1">
        <p className="text-eyebrow text-forest">{token.role}</p>
        <p className="font-mono text-body">.{token.cls.split(' ').join(' .')}</p>
        <p className="font-mono text-body">Figma: {token.spec}</p>
        {token.mobile && (
          <p className="font-mono text-body">
            <span className="rounded bg-olive/30 px-1">MOBILE · review</span> {token.mobile}
          </p>
        )}
        <Computed el={el} width={width} />
      </div>
      <Tag ref={setEl} className={token.cls}>
        {children}
      </Tag>
    </div>
  )
}

export default function TypeSpecimen() {
  const width = useViewportWidth()
  const atDesktop = width >= 1440

  useEffect(() => {
    document.title = 'Type specimen · Fraqshares'
  }, [])

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-strong/10 bg-mint/95 backdrop-blur">
        <p className="mx-auto max-w-[1440px] px-4 py-2 font-mono text-body sm:px-10">
          Viewport {width}px ·{' '}
          {atDesktop ? (
            <span className="text-forest">display tokens at Figma (1440) values</span>
          ) : (
            <span className="font-bold">below 1440: display tokens are on their clamp() scale</span>
          )}
        </p>
      </div>

      <main className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-10">
        <header className="py-16">
          <p className="text-eyebrow text-forest">Fraqshares · DM Sans 400 / 500 / 700 · Ruberoid (product UI)</p>
          <h1 className="mt-3 text-section-h2">Type specimen</h1>
          <p className="mt-4 max-w-[60ch] text-body-main">
            Every role from the 1440px style guide. Line breaks depend on container width, so compare
            size, leading, weight and tracking against Figma’s inspect panel rather than where lines wrap.
          </p>
        </header>

        <section aria-labelledby="display">
          <h2 id="display" className="pb-6 text-step-title">
            Display &amp; section
          </h2>
          {display.map((t) => (
            <Row key={t.role} token={t} width={width}>
              {t.sample}
            </Row>
          ))}
        </section>

        <section aria-labelledby="reading" className="mt-16">
          <h2 id="reading" className="pb-6 text-step-title">
            Reading &amp; interface
          </h2>
          {reading.map((t) => (
            <Row key={t.role} token={t} width={width}>
              {t.sample}
            </Row>
          ))}
        </section>

        <section aria-labelledby="product" className="mt-16">
          <h2 id="product" className="text-step-title">
            Product UI · Ruberoid
          </h2>
          <p className="mt-2 max-w-[70ch] pb-6 text-body">
            For product-UI artwork only: the hero activity feed and the section-2 image overlays. These are
            card-artwork sizes, kept out of the site tokens. When a card appears larger, scale the whole card
            with transform: scale() rather than adding in-between sizes.
          </p>
          {product.map((t) => (
            <Row key={t.role} token={t} width={width}>
              {t.sample}
            </Row>
          ))}
          <div className="grid gap-x-12 gap-y-4 border-t border-strong/10 py-10 lg:grid-cols-[18rem_1fr]">
            <div className="space-y-1">
              <p className="text-eyebrow text-forest">weights</p>
              <p className="font-mono text-body">Licensed kit · assets-src/fonts</p>
              <p className="font-mono text-body">9 weights + obliques, one family</p>
            </div>
            <ul className="product-ui space-y-2 text-intro-body">
              {ruberoidWeights.map(([name, weight]) => (
                <li key={name} className="flex flex-wrap items-baseline gap-x-6" style={{ fontWeight: weight }}>
                  <span className="w-48 shrink-0">{name}</span>
                  <span>Buy, sell and own shares</span>
                  <span className="italic">Oblique</span>
                  <span className="font-mono text-body font-normal text-secondary">{weight}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="treatments" className="mt-16">
          <h2 id="treatments" className="pb-6 text-step-title">
            Headline color treatments
          </h2>
          <Row
            token={{ role: 'split-tone H2', cls: 'text-section-h2', spec: 'muted #999 → strong #111, one heading' }}
            width={width}
            as="h3"
          >
            <span className="text-muted">More ways to invest.</span>{' '}
            <span className="text-strong">More possibilities to grow.</span>
          </Row>
          <Row
            token={{
              role: 'conversion headline',
              cls: 'text-conversion-headline',
              spec: '“Own a share.” forest @ 50%, rest forest @ 100%',
            }}
            width={width}
            as="h3"
          >
            <span className="text-forest/50">Own a share.</span>{' '}
            <span className="text-forest">Expand your possibilities.</span>
          </Row>
        </section>

        <section aria-labelledby="colors" className="mt-16">
          <h2 id="colors" className="pb-6 text-step-title">
            Colors
          </h2>
          <ul className="grid gap-4 border-t border-strong/10 pt-10 sm:grid-cols-2 lg:grid-cols-5">
            {colors.map((c) => (
              <li key={c.name}>
                <div
                  className="aspect-[4/3] rounded-lg border border-strong/10"
                  style={{ background: `var(--color-${c.name})` }}
                />
                <p className="mt-3 text-footer-heading">{c.name}</p>
                <p className="font-mono text-body">
                  {c.hex} · text-{c.name}
                </p>
                <p className="text-body">{c.note}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}
