/** Glossary page behaviour switches and timings. */
export const GLOSSARY = {
  /** Mark the search match in titles and definitions. */
  highlightMatches: true,
  /** Typing settles this long before the list filters (ms). */
  searchDebounceMs: 150,
  /** Space kept above a term scrolled to from a link (/glossary#slug), and above the sticky sidebar.
   *  The site header isn't sticky, so this is from the screen's top edge (px). */
  topOffset: 40,
}
