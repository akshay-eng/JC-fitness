import { useLayoutEffect, useRef, type CSSProperties, type ElementType } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'

type Line = string | { text: string; className?: string }

type Props = {
  lines: Line[]
  as?: ElementType
  className?: string
  /** Resting width axis (62 = most condensed). */
  width?: number
  weight?: number
  id?: string
  style?: CSSProperties
}

/**
 * Section headline. On scroll-in each character rises out of its line's clip
 * while the whole line contracts from wide to condensed: type that flexes.
 */
export function KineticHeading({ lines, as: Tag = 'h2', className, width = 68, weight = 900, id, style }: Props) {
  const ref = useRef<HTMLElement>(null)
  const label = lines.map((l) => (typeof l === 'string' ? l : l.text)).join(' ')

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const chars = el.querySelectorAll('[data-char]')
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
      tl.fromTo(chars, { yPercent: 110, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 0.8, ease: 'expo.out', stagger: 0.018 })
      tl.fromTo(el, { '--wd': 125 }, { '--wd': width, duration: 1.1, ease: 'expo.out' }, 0)
    }, el)
    return () => ctx.revert()
  }, [width])

  return (
    <Tag
      ref={ref}
      id={id}
      aria-label={label}
      className={cn('display', className)}
      style={{ ['--wd' as string]: width, ['--wg' as string]: weight, ...style }}
    >
      {lines.map((line, li) => {
        const text = typeof line === 'string' ? line : line.text
        const cls = typeof line === 'string' ? undefined : line.className
        return (
          <span key={li} aria-hidden="true" className={cn('block overflow-clip pb-[0.06em]', cls)}>
            {Array.from(text).map((ch, ci) => (
              <span key={ci} data-char className="inline-block will-change-transform">
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </span>
        )
      })}
    </Tag>
  )
}
