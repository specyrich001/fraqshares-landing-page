// Where the site's links go, in one place.

/** The Fraqshares web app: Log In, and every Get Started / Start Investing button. */
export const LOGIN_URL = 'https://app.fraqshares.com/auth/login'
export const SIGNUP_URL = 'https://app.fraqshares.com/auth/signup'

/** "How It Works": the Getting Started in 5 steps section, on the home page (so it works from every page). */
export const HOW_IT_WORKS_HREF = '/#getting-started'

export const ABOUT_HREF = '/about'

/** The nav's Learn and the hero's Learn More; also the link cards and the footer. */
export const GLOSSARY_HREF = '/glossary'

/** The home page's FAQ section: the footer and the About / Glossary / Contact link cards. */
export const FAQ_HREF = '/#faq'

/** The Contact page: the nav's Contact Us, the home page FAQ's "Contact Us" and the link cards. */
export const CONTACT_HREF = '/contact'

/** The legal pages: the footer (and the Terms link to the Privacy Policy). */
export const PRIVACY_POLICY_HREF = '/privacy-policy'
export const TERMS_HREF = '/terms-and-conditions'

/** The current page's path without a trailing slash ('' for home), to mark its nav link aria-current. */
export const currentPath = () => (typeof window === 'undefined' ? '' : window.location.pathname.replace(/\/$/, ''))

/** Social profiles, as supplied (the X, Facebook and Instagram links keep their share parameters). */
export const SOCIAL_URLS = {
  x: 'https://x.com/fraqshares?s=11',
  facebook: 'https://www.facebook.com/share/1HCBfGSxf7/?mibextid=wwXIfr',
  linkedin: 'https://www.linkedin.com/company/fraqshares/',
  instagram: 'https://www.instagram.com/fraqshares?dlrf=bnV4MTR2MTdyZTNi',
} as const
