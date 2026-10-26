// Shared link/button classes so header and hero hover/focus states stay in step.

export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest'

/** On the photo the forest ring disappears, so dark backgrounds get a white one. */
export const focusRingOnDark = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

/** Square-cornered link styled as a button; callers add height, padding and colours. */
export const buttonBase =
  'inline-flex shrink-0 items-center whitespace-nowrap text-button transition-colors duration-150 motion-reduce:transition-none'
