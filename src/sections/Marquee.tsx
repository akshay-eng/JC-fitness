import { useLayoutEffect, useRef } from 'react'
import { PlateGlyph } from '@/components/icons'
import { marqueeItems } from '@/content'
import { gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/gsap'
import { cn } from '@/lib/utils'

const BANDS = [
  { dir: -1, rotate: -3.5, cls: 'bg-brand text-bg', outline: false },
  { dir: 1, rotate: 2.5, cls: 'bg-bg text-fg shadow-[0_0_0_1px_rgb(234_242_247/0.12)]', outline: true },
]

/** Two crossing tape bands. Scroll speed winds them up and skews them. */
export function Marquee() {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !root.current) return
    const ctx = gsap.context(() => {
      const loops = gsap.utils.toArray<HTMLElement>('[data-track]').map((track, i) =>
        gsap.fromTo(
          track,
          { xPercent: BANDS[i].dir < 0 ? 0 : -50 },
          { xPercent: BANDS[i].dir < 0 ? -50 : 0, duration: 28, ease: 'none', repeat: -1 },
        ),
      )
      const skew = gsap.quickTo('[data-track]', 'skewX', { duration: 0.4, ease: 'power3.out' })
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const v = self.getVelocity()
          const boost = 1 + Math.min(Math.abs(v) / 250, 7)
          loops.forEach((l) => {
            gsap.to(l, { timeScale: boost * (self.direction || 1), duration: 0.15, overwrite: true })
            gsap.to(l, { timeScale: self.direction || 1, duration: 1.2, delay: 0.15, ease: 'power2.out' })
          })
          skew(gsap.utils.clamp(-10, 10, v / -300))
        },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const row = (outline: boolean) =>
    [...marqueeItems, ...marqueeItems].map((t, i) => (
      <span key={i} className="flex shrink-0 items-center gap-6 px-3">
        <span className={cn('display display-italic whitespace-nowrap', outline && 'text-outline')} style={{ ['--wd' as string]: 68 }}>
          {t}
        </span>
        <PlateGlyph size={26} className={outline ? 'text-brand' : 'text-bg'} />
      </span>
    ))

  return (
    <div ref={root} aria-label="Highlights" role="region" className="relative z-10 -my-6 h-[170px] overflow-clip sm:h-[220px]">
      <p className="sr-only">{marqueeItems.join(', ')}</p>
      {BANDS.map((b, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={cn('absolute top-1/2 left-[-10%] w-[120%] -translate-y-1/2 py-3 sm:py-4', b.cls)}
          style={{ rotate: `${b.rotate}deg` }}
        >
          <div data-track className="flex w-max text-[34px] leading-none sm:text-[52px]">
            {row(b.outline)}
          </div>
        </div>
      ))}
    </div>
  )
}
