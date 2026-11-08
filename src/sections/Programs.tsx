import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { useRef, type PointerEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { BarbellFront } from '@/components/BarbellFront'
import { KineticHeading } from '@/components/KineticHeading'
import { programs, type Program } from '@/content'
import { useBooking } from '@/lib/booking'
import { cn } from '@/lib/utils'

const SPAN: Record<string, string> = {
  strength: 'md:col-span-2 lg:col-span-2 lg:row-span-2',
  olympic: 'lg:col-span-2',
  hiit: '',
  boxing: '',
  yoga: 'lg:col-span-2',
  pt: 'md:col-span-2 lg:col-span-2',
}

/** Card tilt follows the pointer on a spring: it can be interrupted mid-flight. */
const TILT = { stiffness: 220, damping: 20, mass: 0.5 }

export function Programs() {
  return (
    <section id="programs" aria-labelledby="programs-title" className="section">
      <div className="container-x">
        <div className="mb-12 flex flex-col justify-between gap-6 md:mb-16 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow mb-5 text-brand">Programs</p>
            <KineticHeading
              id="programs-title"
              lines={['Built for', { text: 'every kind', className: 'text-outline-fg' }, 'of strong.']}
              className="text-[clamp(56px,10vw,128px)]"
            />
          </div>
          <p className="max-w-sm text-fg/70 lg:pb-3">
            Six disciplines, one membership. Pick a lane or mix them all. Tap any program to book a trial class.
          </p>
        </div>

        <div className="grid auto-rows-[minmax(250px,auto)] grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {programs.map((p, i) => (
            <ProgramCard key={p.id} program={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProgramCard({ program, index }: { program: Program; index: number }) {
  const { book } = useBooking()
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const rx = useSpring(useMotionValue(0), TILT)
  const ry = useSpring(useMotionValue(0), TILT)
  const big = program.id === 'strength'

  const onMove = (e: PointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
    el.style.setProperty('--spot', '1')
    if (reduce) return
    ry.set((px - 0.5) * 8)
    rx.set((0.5 - py) * 8)
  }
  const onLeave = () => {
    ref.current?.style.setProperty('--spot', '0')
    rx.set(0)
    ry.set(0)
  }

  return (
    <motion.article
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={cn(
        'spotlight group relative flex flex-col overflow-clip rounded-[22px] bg-card p-6 shadow-[inset_0_0_0_1px_rgb(244_241_234/0.07)] sm:p-7',
        SPAN[program.id],
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="eyebrow tabular text-muted-foreground">0{index + 1}</span>
        <ProgramIcon kind={program.icon} />
      </div>

      {big && (
        <div className="my-auto px-2 py-6 transition-transform duration-300 ease-[var(--ease-out)] group-hover:-translate-y-2" aria-hidden="true">
          <BarbellFront plates={[25, 20, 15]} label="" />
        </div>
      )}

      <div className={cn('mt-auto', !big && 'pt-10')}>
        <h3 className={cn('display', big ? 'text-[clamp(44px,5vw,72px)]' : 'text-[36px]')} style={{ ['--wd' as string]: 70 }}>
          {program.title}
        </h3>
        <p className="mt-3 max-w-md text-[15px] text-fg/70">{program.line}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="rounded-full bg-fg/[0.06] px-3 py-1.5 text-[12px] tracking-wide text-fg/80">{program.schedule}</span>
          <button
            type="button"
            onClick={() => book({ interest: program.title })}
            className="inline-flex min-h-11 items-center gap-1.5 text-[13px] uppercase tracking-[0.08em] text-brand [font-variation-settings:'wght'_700] after:absolute after:inset-0 after:content-['']"
            aria-label={`Book a trial: ${program.title}`}
          >
            Book a trial
            <ArrowUpRight className="size-4 transition-transform duration-150 ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

/** Small looping glyphs: ambient life, paused for reduced motion via CSS. */
function ProgramIcon({ kind }: { kind: Program['icon'] }) {
  const common = 'size-12 text-brand'
  switch (kind) {
    case 'barbell':
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <g className="origin-center animate-[press_1.6s_var(--ease-move)_infinite] motion-reduce:animate-none">
            <rect x="4" y="22" width="40" height="4" rx="2" fill="currentColor" opacity=".5" />
            <rect x="8" y="12" width="6" height="24" rx="2" fill="currentColor" />
            <rect x="34" y="12" width="6" height="24" rx="2" fill="currentColor" />
          </g>
        </svg>
      )
    case 'olympic':
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <g className="origin-center animate-[spin_4s_linear_infinite] motion-reduce:animate-none">
            <circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" strokeWidth="7" />
            <circle cx="24" cy="24" r="4" fill="currentColor" />
            <rect x="22.5" y="5" width="3" height="7" fill="var(--card)" />
          </g>
        </svg>
      )
    case 'hiit':
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <path
            d="M2 26h10l4-10 6 20 5-14 3 4h16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="90"
            className="animate-[ekg_1.8s_linear_infinite] motion-reduce:animate-none"
          />
        </svg>
      )
    case 'boxing':
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <g className="animate-[jab_1.4s_var(--ease-out)_infinite] motion-reduce:animate-none">
            <path d="M10 18c0-5 4-8 9-8h8c6 0 11 5 11 11v4c0 5-4 9-9 9H17c-4 0-7-3-7-7z" fill="currentColor" />
            <rect x="6" y="30" width="16" height="8" rx="3" fill="currentColor" opacity=".6" />
          </g>
        </svg>
      )
    case 'yoga':
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <circle cx="24" cy="24" r="16" fill="currentColor" opacity=".18" className="origin-center animate-[breathe_4s_ease-in-out_infinite] motion-reduce:animate-none" />
          <circle cx="24" cy="24" r="8" fill="currentColor" className="origin-center animate-[breathe_4s_ease-in-out_infinite] motion-reduce:animate-none" />
        </svg>
      )
    case 'coach':
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <circle cx="24" cy="27" r="15" fill="none" stroke="currentColor" strokeWidth="3.5" />
          <rect x="20" y="5" width="8" height="5" rx="1.5" fill="currentColor" />
          <line x1="24" y1="27" x2="24" y2="17" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="origin-bottom animate-[spin_3s_steps(12)_infinite] motion-reduce:animate-none" />
        </svg>
      )
  }
}
