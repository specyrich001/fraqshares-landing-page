import images from '../../generated/images.json'

/** Section 2's slot photo: the crop of the source in assets-src/wealth/photo.json. */
export const wealthPhoto = images['wealth/photo']

/**
 * The same source uncropped (Figma 10971:74811), used by the hero → section 2 transition so the
 * full-bleed start shows the whole photo at native resolution instead of an enlarged slot crop.
 */
export const wealthFullPhoto = images['wealth/photo-full']

/** Source size and the slot's crop of it — must match assets-src/wealth/photo.json. */
export const wealthPhotoCrop = {
  sourceWidth: 2000,
  sourceHeight: 1333,
  left: 387,
  top: 0,
  width: 971,
  height: 1333,
} as const
