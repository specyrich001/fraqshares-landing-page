import appIcon from '../../assets/icons/fraqshares-app.svg'
import moneyReceiveIcon from '../../assets/icons/money-receive.svg'
import moneySendIcon from '../../assets/icons/money-send.svg'
import { TransactionCard } from '../product/TransactionCard.tsx'

/*
 * Figma: Group 2147222581 (10952:46209). Illustrative product UI, so the whole graphic is
 * aria-hidden. Static for now: each card and the connector carry data-feed-* hooks so the
 * micro-interactions can target them later without restructuring.
 *
 * Coordinates below are relative to the 306px-wide wrapper (Figma left 988, top 103).
 */

const cardShadow = 'shadow-[0_4px_24px_rgba(0,0,0,0.15)]'

export function HeroActivityFeed({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" data-feed className={`product-ui w-[306px] ${className}`}>
      <div data-feed-stack className="flex flex-col gap-2">
        {/* Older notifications fading up the stack. */}
        <div
          data-feed-card="ghost"
          className={`h-[72px] bg-linear-to-b from-white/0 from-40% to-white/5 ${cardShadow}`}
        />

        {/* Figma "background blur 44" = CSS blur(22px): Figma's value is twice the CSS radius. */}
        <div
          data-feed-card="notification"
          className={`relative h-[125px] bg-white/10 px-4 pt-[13px] text-white backdrop-blur-[22px] ${cardShadow}`}
        >
          <div className="flex items-center gap-2">
            <img src={appIcon} width={24} height={24} alt="" />
            <p className="product-app">Fraqshares</p>
          </div>
          <p className="product-time absolute top-[19px] left-[266px]">Now</p>
          <p className="product-title mt-[21px]">New Property Listing</p>
          <p className="product-detail mt-1 max-w-[236px]">
            We have found new properties for you to add to your portfolio.
          </p>
        </div>

        <TransactionCard
          data-feed-card="transaction-in"
          media={<img src={moneyReceiveIcon} width={32} height={32} alt="" className="shrink-0" />}
          title="Wallet successfully funded"
          meta="10 minutes ago"
          amount="+₦250,000"
          amountClassName="product-amount text-money-in"
        />
        <TransactionCard
          data-feed-card="transaction-out"
          media={<img src={moneySendIcon} width={32} height={32} alt="" className="shrink-0" />}
          title="1 unit of 450sqm of land purchased"
          meta="2 hours ago"
          amount="-₦360,000"
          amountClassName="product-amount text-money-out"
        />
      </div>

      {/* Connector: line runs y 359→452 and the dot centres at (153, 479) in wrapper space
          (section 1141, 462→555 and 582). The dot's 7px ring sits fully outside it (Figma: r 11 → 18). */}
      <div data-feed-connector className="absolute top-[359px] left-[135px] h-[138px] w-9">
        {/* Figma spaces the 6/6 dashes to fit 93px, with half dashes at both ends. */}
        <svg
          data-feed-line
          xmlns="http://www.w3.org/2000/svg"
          width="2"
          height="93"
          viewBox="0 0 2 93"
          fill="none"
          className="absolute top-0 left-[17px]"
        >
          <path
            d="M1 0V2.90625M1 93V90.0938M1 8.71875V14.5312M1 20.3438V26.1562M1 31.9688V37.7812M1 43.5938V49.4062M1 55.2188V61.0312M1 66.8438V72.6562M1 78.4688V84.2812"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
        <svg
          data-feed-dot
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          className="absolute top-[102px] left-0"
        >
          <circle data-feed-dot-ring cx="18" cy="18" r="14.5" stroke="white" strokeOpacity="0.2" strokeWidth="7" />
          <circle cx="18" cy="18" r="11" fill="white" />
        </svg>
      </div>
    </div>
  )
}
