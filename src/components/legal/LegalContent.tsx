import type { LegalBlock, LegalDocument, LegalLink } from '../../content/legal/types.ts'
import { focusRing } from '../linkStyles.ts'

/** Prose and list items: #111 at 70%. Line breaks in the text are kept. Below 1024, legal text at 16/24
 *  (the style guide's responsive system, 8.2: "legal stays 16/24"). */
const prose = 'whitespace-pre-line text-body-muted max-lg:leading-[1.5]'

function WithLink({ text, link }: { text: string; link?: LegalLink }) {
  const at = link ? text.indexOf(link.text) : -1
  if (!link || at < 0) return text
  const underline = link.plain ? 'decoration-1 underline-offset-4 hover:underline focus-visible:underline' : 'underline decoration-from-font [text-underline-position:from-font]'
  return (
    <>
      {text.slice(0, at)}
      <a href={link.href} className={`font-medium ${underline} ${focusRing}`}>
        {link.text}
      </a>
      {text.slice(at + link.text.length)}
    </>
  )
}

function Block({ block }: { block: LegalBlock }) {
  if ('list' in block) {
    // Figma: each item indented 27px, its number or bullet hanging in the indent.
    const List = block.bullets ? 'ul' : 'ol'
    return (
      <List className={`pl-[27px] ${block.bullets ? 'list-disc' : 'list-decimal'} ${prose}`}>
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </List>
    )
  }
  if ('clause' in block) return <p className="font-medium text-strong max-lg:leading-[1.5]">{block.clause}</p>
  return (
    <p className={prose}>
      <WithLink text={block.text} link={block.link} />
    </p>
  )
}

/**
 * A legal page's text, Figma: Privacy policy Desktop - 32 (11126:116110), Terms and conditions
 * Desktop - 32 (11126:116001). White, 130px top and bottom, one 741 column centred: the intro (711
 * wide), then the sections, all 50px apart. In each, the heading (24px bold #111) and its blocks 24px
 * apart, 18px / 140%: prose and lists in Regular #111 at 70%, numbered sub-clauses ("4.1. …") in
 * Medium #111. Lists hang their numbers or bullets in a 27px indent.
 *
 * Below 1024 (no mobile frame; the style guide's responsive system, Figma 10964:73254 8.2): a 64px
 * section inset, 24px sides as on every other page (560 max on tablets), sections 40px apart, 16px
 * inside; 20px headings, and the legal text at 16/24.
 */
export function LegalContent({ document: { intro, sections } }: { document: LegalDocument }) {
  return (
    <section className="relative z-10 bg-white py-[130px] max-lg:py-16">
      <div className="page-row max-lg:max-w-[560px] max-lg:px-6">
        <div className="mx-auto flex max-w-[741px] flex-col gap-[50px] text-intro-body-tight max-lg:gap-10">
          {intro && <p className={`max-w-[711px] ${prose}`}>{intro}</p>}
          {sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-6 max-lg:gap-4">
              <h2 className="text-category-title text-strong">{section.title}</h2>
              {section.blocks.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
