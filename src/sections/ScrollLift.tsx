import { useLayoutEffect, useRef, useState } from 'react'
import { KineticHeading } from '@/components/KineticHeading'
import { Lifter, type LifterHandle } from '@/components/lifter/Lifter'
import { cleanAndJerk, POSES } from '@/components/lifter/timelines'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'setup', name: 'Set up', cue: 'Bar over mid-foot, hips above knees, lats tight.' },
  { id: 'pull', name: 'Pull', cue: 'Push the floor away. Bar stays close.' },
  { id: 'catch', name: 'Catch', cue: 'Pull yourself under. Elbows fast.' },
  { id: 'stand', name: 'Stand', cue: 'Front squat it up. Chest proud.' },
  { id: 'jerk', name: 'Jerk', cue: 'Dip, drive, split. Punch the ceiling.' },
  { id: 'lockout', name: 'Lockout', cue: 'Feet together, bar still. Three white lights.' },
]

export function ScrollLift() {
  const root = useRef<HTMLElement>(null)
  const lifter = useRef<LifterHandle>(null)
  const rail = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [reduced] = useState(prefersReducedMotion)

  useLayoutEffect(() => {
    const h = lifter.current
    if (!h || !root.current) return
    if (reduced) {
      h.snap(POSES.lockout)
      h.state.lights = 3
      h.render()
      if (rail.current) rail.current.style.transform = 'scaleY(1)'
      setStep(STEPS.length - 1)
      return
    }
    const ctx = gsap.context(() => {
      const tl = cleanAndJerk(h, { holds: false, drop: false, labels: true, effects: false })
      tl.pause()
      const order = STEPS.map((s) => s.id)
      const mm = gsap.matchMedia()
      mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' }, (c) => {
        gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: c.conditions?.desktop ? '+=260%' : '+=200%',
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => {
              const label = tl.currentLabel()
              const idx = Math.max(0, order.indexOf(label))
              setStep((prev) => (prev === idx ? prev : idx))
              if (rail.current) rail.current.style.transform = `scaleY(${self.progress})`
            },
          },
        }).to(tl, { progress: 1, ease: 'none' })
      })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section ref={root} id="lift" aria-labelledby="lift-title" className="relative flex min-h-[100svh] items-center overflow-clip px-[var(--gutter)] py-20">
      <div aria-hidden="true" className="grid-lines pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,#000_20%,#000_80%,transparent)]" />
      <div className="container-x relative grid items-center gap-8 md:grid-cols-[1fr_1.1fr_auto] md:gap-12">
        <div className="order-1">
          <p className="eyebrow mb-5 text-brand">Scroll to lift</p>
          <KineticHeading id="lift-title" lines={['Six moves.', { text: 'One lift.', className: 'text-brand' }]} className="text-[clamp(56px,11vw,120px)]" />
          <p className="mt-6 max-w-sm text-fg/70">
            Our coaches teach every position of the clean &amp; jerk, starting from an empty bar.
          </p>

          <ol className="mt-8 hidden gap-1 md:grid" aria-label="Phases of the clean and jerk">
            {STEPS.map((s, i) => (
              <li
                key={s.id}
                aria-current={i === step ? 'step' : undefined}
                className={cn(
                  'grid grid-cols-[40px_1fr] items-baseline gap-2 border-t border-fg/10 py-3 transition-opacity duration-200',
                  i === step ? 'opacity-100' : i < step ? 'opacity-45' : 'opacity-25',
                )}
              >
                <span className={cn('eyebrow tabular', i === step ? 'text-brand' : 'text-muted-foreground')}>0{i + 1}</span>
                <span>
                  <span className="display block text-2xl" style={{ ['--wd' as string]: 72 }}>
                    {s.name}
                  </span>
                  {i === step && <span className="mt-1 block text-sm text-fg/70">{s.cue}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative order-2 mx-auto w-full max-w-[420px] md:max-w-[520px]">
          <span
            aria-hidden="true"
            className="display pointer-events-none absolute inset-0 grid place-items-center text-[clamp(200px,40vw,460px)] leading-none text-fg/[0.05] tabular"
            style={{ ['--wd' as string]: 62 }}
          >
            0{step + 1}
          </span>
          <Lifter ref={lifter} label="Lifter performing a clean and jerk as you scroll" className="relative" />
          {/* mobile: current phase */}
          <div className="mt-4 border-t border-fg/10 pt-4 md:hidden" aria-live="polite">
            <p className="eyebrow text-brand">
              0{step + 1} / 0{STEPS.length}
            </p>
            <p className="display mt-1 text-4xl" style={{ ['--wd' as string]: 70 }}>
              {STEPS[step].name}
            </p>
            <p className="mt-1 text-sm text-fg/70">{STEPS[step].cue}</p>
          </div>
        </div>

        <div className="order-3 hidden h-[60vh] w-1 rounded-full bg-fg/10 md:block" aria-hidden="true">
          <div ref={rail} className="h-full w-full origin-top scale-y-0 rounded-full bg-brand" />
        </div>
      </div>
    </section>
  )
}
