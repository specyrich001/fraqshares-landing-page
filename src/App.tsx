import { FeatureSection } from './components/features/FeatureSection.tsx'
import { SiteHeader } from './components/SiteHeader.tsx'
import { HeroWealthStage } from './components/stage/HeroWealthStage.tsx'
import { useSmoothScroll } from './motion/useSmoothScroll.ts'

export default function App() {
  useSmoothScroll()

  return (
    <>
      <SiteHeader overlay />
      <main>
        <HeroWealthStage />
        <FeatureSection />
      </main>
    </>
  )
}
