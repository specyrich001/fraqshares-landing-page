import type { ReactNode } from 'react'

type Props = {
  /** The H1's id, for the section's aria-labelledby. */
  id: string
  /** The heading's first, muted part ("Building wealth"); the line breaks after it. */
  muted: string
  /** The rest of the heading, in #111. */
  heading: string
  paragraphs: ReactNode[]
  /** Width (and any extras) for the heading: each page's Figma box. */
  headingClassName?: string
  /** Width (and any extras) for the paragraphs. */
  copyClassName?: string
}

/**
 * An inner page's opening row (About 11049:449, Glossary 11092:79278): the split-tone page-title H1 on
 * the left, the intro-body-tight paragraphs on the right, spread apart and centred against each other.
 * Both designs break the heading after its muted part, so the break is built in.
 *
 * Below 1024 (About 11074:45092): one centred stack, 24px between heading and paragraphs, both full
 * width (the page's row sets the 24px sides); the tokens step down to 42px and 16px themselves.
 *
 * Just the row: each page wraps it in its own section (padding, background, what follows). The
 * paragraphs sit in [data-intro-copy], which About's text intro animates.
 */
export function PageIntro({ id, muted, heading, paragraphs, headingClassName = '', copyClassName = '' }: Props) {
  return (
    <div className="flex items-center justify-between gap-10 max-lg:flex-col max-lg:gap-6 max-lg:text-center">
      <h1 id={id} className={`max-w-full text-page-title text-strong max-lg:w-full ${headingClassName}`}>
        <span className="text-muted">{muted}</span>
        <br /> {heading}
      </h1>
      {/* Figma separates the paragraphs with an empty line: one line height (1.4em). */}
      <div
        data-intro-copy
        className={`max-w-full shrink-0 text-intro-body-tight text-body-muted max-lg:mr-0 max-lg:w-full [&>p+p]:mt-[1.4em] ${copyClassName}`}
      >
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  )
}
