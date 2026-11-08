import { useLayoutEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { session } from '@/lib/storage'
import { BarbellFront } from './BarbellFront'

const PLATES = [25, 25, 20]
const TOTAL = 20 + PLATES.reduce((a, b) => a + b, 0) * 2

/**
 * "Loading the bar": plates slam onto the sleeves while the counter climbs,
 * the bar is lifted, and the curtain splits. Plays once per browser session;
 * skipped entirely under reduced motion.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const [gone, setGone] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    if (prefersReducedMotion() || session.get('jc-loaded')) {
      setGone(true)
      onDone()
      return
    }
    session.set('jc-loaded', '1')
    document.documentElement.style.overflow = 'hidden'

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          document.documentElement.style.overflow = ''
          setGone(true)
        },
      })
      const counter = { v: 20 }
      tl.from('[data-bar]', { scaleX: 0.2, opacity: 0, duration: 0.45, ease: 'expo.out' })
      PLATES.forEach((_, i) => {
        tl.from(
          `[data-plate][data-index="${i}"][data-side="-1"]`,
          { x: -320, duration: 0.32, ease: 'back.out(1.6)' },
          i === 0 ? '>-0.1' : '>-0.12',
        )
        tl.from(`[data-plate][data-index="${i}"][data-side="1"]`, { x: 320, duration: 0.32, ease: 'back.out(1.6)' }, '<')
        tl.to('[data-bar]', { y: 3, duration: 0.06, yoyo: true, repeat: 1, ease: 'power2.out' }, '>-0.08')
      })
      tl.to(
        counter,
        {
          v: TOTAL,
          duration: tl.duration() - 0.3,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (count.current) count.current.textContent = String(Math.round(counter.v))
          },
        },
        0.3,
      )
      // Anticipation dip, then the lift.
      tl.to('[data-bar]', { y: 10, duration: 0.18, ease: 'power2.in' })
      tl.to('[data-bar]', { y: -60, scale: 1.04, duration: 0.32, ease: 'expo.out' })
      tl.to('[data-meta]', { opacity: 0, duration: 0.2 }, '<')
      tl.call(onDone)
      tl.to('[data-half="top"]', { yPercent: -100, duration: 0.75, ease: 'expo.inOut' }, '>-0.05')
      tl.to('[data-half="bottom"]', { yPercent: 100, duration: 0.75, ease: 'expo.inOut' }, '<')
      tl.to('[data-bar]', { y: -400, opacity: 0, duration: 0.6, ease: 'expo.in' }, '<')
    }, el)
    return () => {
      ctx.revert()
      document.documentElement.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (gone) return null

  return (
    <div ref={root} className="fixed inset-0 z-[120]" aria-hidden="true">
      <div data-half="top" className="absolute inset-x-0 top-0 h-1/2 bg-bg" />
      <div data-half="bottom" className="absolute inset-x-0 bottom-0 h-1/2 bg-bg" />
      <div className="absolute inset-0 grid place-items-center px-6">
        <div className="w-full max-w-[560px]">
          <div data-bar className="origin-center">
            <BarbellFront plates={PLATES} label="Loading the bar" />
          </div>
          <div data-meta className="mt-6 flex items-end justify-between gap-4">
            <span className="eyebrow text-muted-foreground">Loading the bar</span>
            <span className="display display-italic text-5xl text-brand" style={{ ['--wd' as string]: 62 }}>
              <span ref={count} className="tabular">20</span>
              <span className="ml-1 text-2xl text-fg">kg</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
