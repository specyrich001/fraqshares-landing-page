/**
 * FAQ copy: the one source for both the accordion and the FAQPage structured data. Wording is the
 * client's, verbatim (including ₦ and the curly apostrophe).
 */
import { MIN_INVESTMENT } from '../minimumInvestment.ts'

export type Faq = { question: string; answer: string }

export const faqs: Faq[] = [
  {
    question: 'What is Fraqshares?',
    answer:
      'Fraqshares is a fractional investment platform that lets you buy shares in real estate, land, and businesses without purchasing the entire asset.',
  },
  {
    question: 'How does Fraqshares select investments?',
    answer:
      'We source properties from trusted owners and developers, alongside businesses with low overheads and strong margins. Proposed listings undergo legal due diligence, market analysis, and independent valuation, with location and past performance assessed where relevant.',
  },
  {
    question: 'What is the minimum investment?',
    answer: `You can start investing on Fraqshares with ${MIN_INVESTMENT}.`,
  },
  {
    question: 'What do I legally own?',
    answer:
      'Each listed asset or business is held through a dedicated Special Purpose Vehicle (SPV). Your investment gives you a proportional stake in that SPV, with ownership rights set out in the investment documents.',
  },
  {
    question: 'How can I earn returns?',
    answer:
      'Depending on the investment, you may receive rental income or distributions from business earnings. You may also benefit from an increase in the value of your shares when you sell. Income and growth are not guaranteed, and investment values can fall.',
  },
  {
    question: 'What safeguards are in place?',
    answer:
      'Investment funds are held in escrow, with an independent trustee approving transactions to oversee their use. These safeguards support accountability but do not eliminate investment risk.',
  },
  {
    question: 'How can I sell my shares?',
    answer:
      'After any required holding period, you can submit a sell request on Fraqshares. A sale depends on a buyer matching your offer.',
  },
  {
    question: 'What fees does Fraqshares charge?',
    answer:
      'Fraqshares charges no purchase fee on initial investments and a 2.5% fee on secondary trades. Review the relevant listing and fee schedule for any other applicable costs.',
  },
  {
    question: 'What happens if Fraqshares stops operating?',
    answer:
      'Your ownership interest is held through the investment’s SPV. The SPV and trustee arrangements are intended to preserve investor rights independently of Fraqshares. The applicable investment documents explain how ownership and administration would be handled if the platform stopped operating.',
  },
]
