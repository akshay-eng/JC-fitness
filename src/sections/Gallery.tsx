import { useLayoutEffect, useRef, useState } from 'react'
import { KineticHeading } from '@/components/KineticHeading'
import { Photo } from '@/components/Photo'
import { gallery, type GalleryPhoto } from '@/content'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'

/** Portrait photos (taller than wide, from the size note) get a narrow frame. */
const isTall = (g: GalleryPhoto) => {
  const [w, h] = g.size.split('×').map((n) => Number(n.trim()))
  return h > w
}

/**
 * Two strips of slanted photo frames that slide in opposite directions as the
 * page scrolls, like contact strips pinned across the wall.
 */
export function Gallery() {
  const root = useRef<HTMLElement>(null)
  const [reduced] = useState(prefersReducedMotion)
  const half = Math.ceil(gallery.length / 2)
  const rows = [gallery.slice(0, half), gallery.slice(half)]

  useLayoutEffect(() => {
    if (reduced || !root.current) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-strip]').forEach((strip, i) => {
        const travel = () => -(strip.scrollWidth - window.innerWidth) * 0.55
        gsap.fromTo(
          strip,
          { x: i === 0 ? 0 : travel },
          { x: i === 0 ? travel : 0, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } },
        )
      })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section ref={root} id="gallery" aria-labelledby="gallery-title" className="section overflow-clip !px-0">
      <div className="px-[var(--gutter)]">
      <div className="container-x mb-14 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow mb-5 text-volt">Inside JC</p>
          <KineticHeading id="gallery-title" lines={['Come see', { text: 'the club.', className: 'text-outline-fg' }]} className="text-[clamp(52px,9.5vw,124px)]" />
        </div>
        <p className="max-w-sm text-fg/70 lg:pb-3">The floor, the platforms, the bags and the people. Better in person: your first session is free.</p>
      </div>
      </div>

      <div className="-rotate-[2.5deg] space-y-5 py-4 sm:space-y-6">
        {rows.map((row, ri) => (
          <div key={ri} className={cn(reduced && 'overflow-x-auto px-[var(--gutter)] [scrollbar-width:none]')}>
            <ul data-strip className={cn('flex w-max gap-4 sm:gap-6', ri === 1 && 'pl-[12vw]')}>
              {[...row, ...row].map((g, i) => (
                <Frame key={`${g.src}-${i}`} photo={g} index={i % row.length} row={ri} duplicate={i >= row.length} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function Frame({ photo, index, row, duplicate }: { photo: GalleryPhoto; index: number; row: number; duplicate: boolean }) {
  const tall = isTall(photo)
  return (
    <li
      aria-hidden={duplicate || undefined}
      className={cn(
        'group relative shrink-0 -skew-x-[7deg] overflow-clip rounded-[10px] bg-card shadow-[0_20px_50px_rgb(0_0_0/0.45)]',
        'h-[230px] sm:h-[300px] lg:h-[360px]',
        tall ? 'w-[175px] sm:w-[225px] lg:w-[270px]' : 'w-[330px] sm:w-[440px] lg:w-[540px]',
        (index + row) % 3 === 1 && 'translate-y-5',
      )}
    >
      {/* Counter-skew the photo so only the frame leans. */}
      <div className="absolute inset-y-0 -inset-x-[14%] skew-x-[7deg]">
        <Photo
          src={photo.src}
          alt={duplicate ? '' : photo.alt}
          label="Drop photo here"
          size={photo.size}
          tone="duo"
          className="absolute inset-0"
          imgClassName="group-hover:scale-[1.06]"
        />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
      {/* Taped-on caption */}
      <span
        className={cn(
          'eyebrow absolute bottom-4 left-6 skew-x-[7deg] -rotate-2 px-2.5 py-1.5 text-bg shadow-[0_4px_12px_rgb(0_0_0/0.3)]',
          (index + row) % 2 === 0 ? 'bg-volt' : 'bg-brand',
        )}
      >
        {photo.label}
      </span>
    </li>
  )
}
