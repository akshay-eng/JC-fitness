import { useEffect, useState } from 'react'
import { Cursor } from '@/components/Cursor'
import { Nav } from '@/components/Nav'
import { Preloader } from '@/components/Preloader'
import { WhatsAppFab } from '@/components/WhatsAppFab'
import { BookingProvider } from '@/lib/booking'
import { FluidProvider } from '@/lib/fluid-provider'
import { ScrollTrigger } from '@/lib/gsap'
import { initSmoothScroll } from '@/lib/scroll'
import { Contact } from '@/sections/Contact'
import { Events } from '@/sections/Events'
import { Floor } from '@/sections/Floor'
import { Footer } from '@/sections/Footer'
import { Gallery } from '@/sections/Gallery'
import { Hero } from '@/sections/Hero'
import { LiftLab } from '@/sections/LiftLab'
import { Marquee } from '@/sections/Marquee'
import { Pricing } from '@/sections/Pricing'
import { Programs } from '@/sections/Programs'
import { ScrollLift } from '@/sections/ScrollLift'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => initSmoothScroll(), [])

  // Fonts change line lengths, and so every pinned section's measurements.
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [])

  return (
    <FluidProvider shape="rounded">
      <BookingProvider>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Preloader onDone={() => setReady(true)} />
        <Nav />
        <main id="main">
          <Hero ready={ready} />
          <Marquee />
          <ScrollLift />
          <Programs />
          <Floor />
          <LiftLab />
          <Events />
          <Gallery />
          <Pricing />
          <Contact />
        </main>
        <Footer />
        <WhatsAppFab show={ready} />
        <Cursor />
        <div className="grain" aria-hidden="true" />
      </BookingProvider>
    </FluidProvider>
  )
}
