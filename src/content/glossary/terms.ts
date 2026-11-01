import type { GlossaryBlock, GlossaryTerm } from './types.ts'

/** A one-paragraph definition. */
const p = (text: string): GlossaryBlock[] => [{ type: 'paragraph', text }]

/**
 * Every glossary term. Wording is as supplied, verbatim (typographic quotes, dashes, ₦). `order` is
 * the curated position within the category. Add a term here and it appears in its category, the
 * letter filter, search and the structured data; nothing else to change.
 */
export const terms: GlossaryTerm[] = [
  // Ownership & Investment Basics
  {
    slug: 'fractional-ownership',
    term: 'Fractional Ownership',
    category: 'ownership-basics',
    order: 1,
    definition: p(
      'Fractional ownership allows multiple investors to hold a proportional interest in an asset without each buying it outright. On Fraqshares, investors hold a stake in the Special Purpose Vehicle (SPV) that owns the listed property, land, or business.',
    ),
  },
  {
    slug: 'fractional-real-estate-investing',
    term: 'Fractional Real Estate Investing',
    category: 'ownership-basics',
    order: 2,
    definition: p(
      'Fractional real estate investing means buying a share of an investment in property rather than purchasing the whole property yourself. Depending on the opportunity, investors may receive rental income distributions and benefit from an increase in value.',
    ),
  },
  {
    slug: 'fractional-land-investment',
    term: 'Fractional Land Investment',
    category: 'ownership-basics',
    order: 3,
    definition: p(
      'Fractional land investment allows investors to share ownership of a land investment through a defined legal structure. Returns may depend on future resale, leasing, or development. Undeveloped land does not automatically generate regular income.',
    ),
  },
  {
    slug: 'business-equity-investment',
    term: 'Business Equity Investment',
    category: 'ownership-basics',
    order: 4,
    definition: p(
      'Business equity investment means providing capital in exchange for an ownership interest in a business, directly or through an investment vehicle. Investors may benefit from distributions of business earnings or growth in their stake’s value, while sharing the risk of losses.',
    ),
  },
  {
    slug: 'shares-or-units',
    term: 'Shares or Units',
    category: 'ownership-basics',
    order: 5,
    definition: p(
      'Shares or units represent portions of an investment. On Fraqshares, they represent your interest in the relevant SPV. The investment documents explain what each share or unit entitles you to, including any income, voting, and transfer rights.',
    ),
  },
  {
    slug: 'equity-stake',
    term: 'Equity Stake',
    category: 'ownership-basics',
    order: 6,
    definition: p(
      'An equity stake is your percentage ownership interest in a company or investment vehicle. For example, holding 100 of an SPV’s 10,000 equally entitled shares represents a 1% stake in that SPV.',
    ),
  },
  {
    slug: 'special-purpose-vehicle-spv',
    term: 'Special Purpose Vehicle (SPV)',
    category: 'ownership-basics',
    order: 7,
    keywords: ['SPV'],
    definition: p(
      'An SPV is a separate legal entity created for a specific purpose, such as holding a property or business investment. On Fraqshares, each listed asset or business is held through a dedicated SPV. Investors’ rights are defined in its investment documents.',
    ),
  },
  {
    slug: 'minimum-investment',
    term: 'Minimum Investment',
    category: 'ownership-basics',
    order: 8,
    definition: p(
      'The minimum investment is the smallest amount you can commit to an opportunity. You can start investing on Fraqshares with {{minInvestment}}. Check each listing for its unit price and applicable investment requirements.',
    ),
  },
  {
    slug: 'investment-portfolio',
    term: 'Investment Portfolio',
    category: 'ownership-basics',
    order: 9,
    definition: p(
      'An investment portfolio is the collection of investments you own. Your Fraqshares portfolio may include interests in properties, land, and businesses, each with different income potential, risks, and expected holding periods.',
    ),
  },
  {
    slug: 'diversification',
    term: 'Diversification',
    category: 'ownership-basics',
    order: 10,
    definition: p(
      'Diversification means spreading your investments across different assets, locations, or sectors to reduce dependence on any single investment. It can help manage risk, but it does not guarantee higher returns or prevent losses.',
    ),
  },

  // Income, Costs & Returns
  {
    slug: 'rental-income',
    term: 'Rental Income',
    category: 'income-costs-returns',
    order: 1,
    definition: p(
      'Rental income is money received from tenants for using a property. The amount available for distribution to investors depends on expenses, taxes, reserves, debt payments where applicable, and the investment’s distribution policy.',
    ),
  },
  {
    slug: 'projected-returns',
    term: 'Projected Returns',
    category: 'income-costs-returns',
    order: 2,
    definition: p(
      'Projected returns are estimates of future investment performance based on assumptions about income, expenses, growth, and sale value. They help illustrate a possible outcome, but actual returns may be lower, negative, or delayed.',
    ),
  },
  {
    slug: 'dividends-and-distributions',
    term: 'Dividends & Distributions',
    category: 'income-costs-returns',
    order: 3,
    definition: p(
      'A dividend is a payment a company makes to shareholders, usually from profits. A distribution is a broader term for money paid to investors, which may come from income, asset sales, or returned capital. Payment amounts and timing depend on the investment; they are not guaranteed.',
    ),
  },
  {
    slug: 'passive-income',
    term: 'Passive Income',
    category: 'income-costs-returns',
    order: 4,
    definition: p(
      'Passive income generally refers to earnings that do not require your day-to-day involvement in operations, such as distributions from a professionally managed property. “Passive” describes your level of involvement—it does not mean the income is guaranteed or the investment needs no monitoring.',
    ),
  },
  {
    slug: 'revenue-and-profit',
    term: 'Revenue & Profit',
    category: 'income-costs-returns',
    order: 5,
    definition: p(
      'Revenue is the money a business earns from selling goods or services before expenses. Profit is what remains after the relevant costs are deducted. A business can generate substantial revenue without making a profit, and accounting profit does not always mean cash is available for investors.',
    ),
  },
  {
    slug: 'cash-flow',
    term: 'Cash Flow',
    category: 'income-costs-returns',
    order: 6,
    definition: p(
      'Cash flow is the movement of money into and out of a property or business. Positive cash flow means more cash comes in than goes out during a period. Available cash may still be needed for debt repayments, reserves, or reinvestment.',
    ),
  },
  {
    slug: 'capital-expenditure-capex',
    term: 'Capital Expenditure (CapEx)',
    category: 'income-costs-returns',
    order: 7,
    keywords: ['CapEx'],
    definition: p(
      'Capital expenditure is money spent to acquire, improve, or extend the useful life of long-term assets, such as buildings or equipment. Examples include replacing a property’s roof or buying business machinery. These costs can reduce cash available for distributions.',
    ),
  },
  {
    slug: 'capital-appreciation',
    term: 'Capital Appreciation',
    category: 'income-costs-returns',
    order: 8,
    definition: p(
      'Capital appreciation is an increase in an investment’s value over time. If your shares rise in value but you still hold them, the increase is an unrealised gain. Appreciation is not guaranteed, and an estimated valuation may differ from the price a buyer will pay.',
    ),
  },
  {
    slug: 'capital-gain-or-loss',
    term: 'Capital Gain or Loss',
    category: 'income-costs-returns',
    order: 9,
    definition: p(
      'A capital gain occurs when you sell an investment for more than its cost; a capital loss occurs when you sell for less. For example, shares bought for ₦100,000 and sold for ₦120,000 produce a ₦20,000 gain before fees and taxes.',
    ),
  },
  {
    slug: 'return-on-investment-roi',
    term: 'Return on Investment (ROI)',
    category: 'income-costs-returns',
    order: 10,
    keywords: ['ROI'],
    definition: [
      {
        type: 'paragraph',
        text: 'ROI expresses an investment’s gain or loss as a percentage of its cost. When assessing overall performance, include income received, changes in investment value, and applicable costs.',
      },
      {
        type: 'paragraph',
        text: 'Always check the period covered: a 15% total return over three years is different from a 15% annual return.',
      },
    ],
  },
  {
    slug: 'rental-yield',
    term: 'Rental Yield',
    category: 'income-costs-returns',
    order: 11,
    definition: [
      {
        type: 'paragraph',
        text: 'Rental yield measures a property’s annual rental income as a percentage of its purchase price or current value.',
      },
      { type: 'formula', text: 'Gross rental yield = Annual rent ÷ Property price or value × 100' },
      {
        type: 'paragraph',
        text: 'For example, a property priced at ₦50 million that earns ₦4 million in annual rent has an 8% gross rental yield.',
      },
      {
        type: 'paragraph',
        text: 'Net rental yield deducts relevant property expenses first. A property’s rental yield is not necessarily the return an investor receives after all investment-level fees and deductions.',
      },
    ],
  },

  // Verification & Investor Safeguards
  {
    slug: 'due-diligence',
    term: 'Due Diligence',
    category: 'verification-safeguards',
    order: 1,
    definition: p(
      'Due diligence is the process of investigating an investment before committing money. It may include reviewing ownership documents, financial records, liabilities, market conditions, and management. It helps identify risks; it does not guarantee performance or remove legal liability.',
    ),
  },
  {
    slug: 'independent-valuation',
    term: 'Independent Valuation',
    category: 'verification-safeguards',
    order: 2,
    definition: p(
      'An independent valuation is an assessment of an asset’s or business’s value by a qualified party independent of the seller. It considers relevant evidence and assumptions at a particular date. It is an informed estimate, not a guaranteed selling price.',
    ),
  },
  {
    slug: 'escrow',
    term: 'Escrow',
    category: 'verification-safeguards',
    order: 3,
    definition: p(
      'Escrow is an arrangement in which a third party holds funds or assets until agreed conditions are met. On Fraqshares, investment funds are held in escrow, with an independent trustee approving transactions to oversee their use. Escrow does not protect against every investment loss.',
    ),
  },
  {
    slug: 'independent-trustee',
    term: 'Independent Trustee',
    category: 'verification-safeguards',
    order: 4,
    definition: p(
      'An independent trustee is a party appointed to carry out responsibilities under a trust arrangement for its beneficiaries. On Fraqshares, the trustee’s role includes approving transactions involving investment funds. Its precise powers and responsibilities are set out in the applicable documents.',
    ),
  },
  {
    slug: 'investment-risk',
    term: 'Investment Risk',
    category: 'verification-safeguards',
    order: 5,
    definition: p(
      'Investment risk is the possibility that an investment performs differently from expectations, including losing some or all of your capital. Property and business investments can face risks such as vacancies, rising costs, falling demand, operational problems, and difficulty selling.',
    ),
  },

  // Selling & Accessing Your Money
  {
    slug: 'holding-period-and-lock-up-period',
    term: 'Holding Period & Lock-Up Period',
    category: 'selling-access',
    order: 1,
    keywords: ['lock-up', 'lockup'],
    definition: p(
      'Your holding period is the length of time you own an investment. A lock-up period is a specified time during which selling or transferring it is restricted. The end of a lock-up period does not guarantee that a buyer will be available.',
    ),
  },
  {
    slug: 'liquidity',
    term: 'Liquidity',
    category: 'selling-access',
    order: 2,
    definition: p(
      'Liquidity describes how easily an investment can be converted into cash without a significant price reduction. Property and private business shares can be difficult to sell quickly. A sell request does not guarantee a completed sale or immediate access to your money.',
    ),
  },
  {
    slug: 'secondary-market',
    term: 'Secondary Market',
    category: 'selling-access',
    order: 3,
    definition: p(
      'A secondary market is where existing investors sell their investments to other buyers, rather than buying newly issued shares. On Fraqshares, investors can submit a sell request after any required holding period. A sale depends on a buyer matching the offer and meeting applicable transaction requirements.',
    ),
  },
]
