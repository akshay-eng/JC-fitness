import { useLayoutEffect, useRef } from 'react'
import { KineticHeading } from '@/components/KineticHeading'
import { Photo } from '@/components/Photo'
import { gallery } from '@/content'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'

/** Bento spans for the six slots, in order. */
const SPAN = [
  'md:col-span-2 lg:col-span-7 lg:row-span-2 aspect-[4/3] lg:aspect-auto',
  'lg:col-span-5 aspect-[16/10]',
  'lg:col-span-5 aspect-[16/10]',
  'lg:col-span-4 aspect-square',
  'lg:col-span-4 aspect-square',
  'md:col-span-2 lg:col-span-4 aspect-[16/10] md:aspect-[21/9] lg:aspect-square',
]

/** Real photos of the club. Every slot fills itself once its file is in public/images/gallery/. */
export function Gallery() {
  const root = useRef<HTMLElement>(null)

  // The photo drifts inside its frame as the frame scrolls past.
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !root.current) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-frame]').forEach((frame) => {
        const img = frame.querySelector('img')
        if (!img) return
        gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} id="gallery" aria-labelledby="gallery-title" className="section">
      <div className="container-x">
        <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow mb-5 text-brand">Inside JC</p>
            <KineticHeading id="gallery-title" lines={['Come see', { text: 'the club.', className: 'text-outline-fg' }]} className="text-[clamp(52px,9.5vw,124px)]" />
          </div>
          <p className="max-w-sm text-fg/70 lg:pb-3">The floor, the platforms, the ring and the people. Better in person: your first session is free.</p>
        </div>

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
          {gallery.map((g, i) => (
            <li key={g.src} data-frame className={cn('group relative overflow-clip rounded-[22px] bg-card shadow-[inset_0_0_0_1px_rgb(244_241_234/0.07)]', SPAN[i])}>
              <Photo
                src={g.src}
                alt={g.alt}
                label="Drop photo here"
                size={g.size}
                className="absolute inset-0"
                imgClassName="scale-[1.14] transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.2]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-bg/80 to-transparent px-7 pt-12 pb-6">
                <span className="eyebrow text-fg">{g.label}</span>
                <span className="eyebrow tabular text-fg/50">0{i + 1}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
