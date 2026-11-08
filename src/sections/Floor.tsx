import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Dumbbell, HeartPulse } from 'lucide-react'
import { KineticHeading } from '@/components/KineticHeading'
import { Lifter, type LifterHandle } from '@/components/lifter/Lifter'
import { prime, STATION_RIGS } from '@/components/lifter/stations'
import { Photo } from '@/components/Photo'
import { Tabs, TabsItem } from '@/components/ui/tabs'
import { stations } from '@/content'
import { useBooking } from '@/lib/booking'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { spring } from '@/lib/springs'
import { cn } from '@/lib/utils'

/** How long a cardio station shows before auto-advancing; strength waits for its rep. */
const CARDIO_DWELL = 5200

export function Floor() {
  const { book } = useBooking()
  const [idx, setIdx] = useState(0)
  const [auto, setAuto] = useState(true)
  const [inView, setInView] = useState(false)
  const [dwell, setDwell] = useState(CARDIO_DWELL)
  const [reduced] = useState(prefersReducedMotion)
  const root = useRef<HTMLElement>(null)
  const figure = useRef<HTMLDivElement>(null)
  const lifter = useRef<LifterHandle>(null)
  const anim = useRef<gsap.core.Animation | null>(null)
  const inViewRef = useRef(false)

  const station = stations[idx]
  const rig = STATION_RIGS[station.id]

  // Play the selected station. The Lifter has already re-rendered with its equipment.
  useEffect(() => {
    const h = lifter.current
    if (!h) return
    anim.current?.kill()
    prime(h, station.id)
    if (reduced) {
      rig.still(h.state)
      h.render()
      return
    }
    const a = rig.play(h)
    if (rig.strength) (a as gsap.core.Timeline).repeat(-1).repeatDelay(0.3)
    anim.current = a
    setDwell(rig.strength ? Math.round(Math.max(4.5, (a as gsap.core.Timeline).duration()) * 1000) + 400 : CARDIO_DWELL)
    if (!inViewRef.current) a.pause()
    if (figure.current) gsap.fromTo(figure.current, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out' })
    return () => {
      a.kill()
    }
  }, [idx, station.id, rig, reduced])

  // Only animate while on screen.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      inViewRef.current = e.isIntersecting
      setInView(e.isIntersecting)
      if (e.isIntersecting) anim.current?.resume()
      else anim.current?.pause()
    }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Walk through the stations until someone picks one.
  useEffect(() => {
    if (!auto || !inView || reduced) return
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % stations.length), dwell)
    return () => window.clearTimeout(t)
  }, [auto, inView, reduced, idx, dwell])

  const choose = (i: number) => {
    setAuto(false)
    setIdx(i)
  }

  const KindIcon = station.kind === 'strength' ? Dumbbell : HeartPulse

  return (
    <section ref={root} id="floor" aria-labelledby="floor-title" className="section">
      <div className="container-x">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow mb-5 text-brand">The floor</p>
            <KineticHeading id="floor-title" lines={['Iron and', { text: 'cardio.', className: 'text-brand' }]} className="text-[clamp(56px,10vw,128px)]" />
          </div>
          <p className="max-w-sm text-fg/70 lg:pb-3">
            Racks, benches and platforms on one side, a full cardio deck on the other. Pick a station to see it in motion.
          </p>
        </div>

        <div className="-mx-[var(--gutter)] mb-4 overflow-x-auto px-[var(--gutter)] pb-1 [scrollbar-width:none]">
          <Tabs selectedIndex={idx} onSelect={choose} idPrefix="floor" aria-label="Stations" className="w-max">
            {stations.map((s, i) => (
              <TabsItem key={s.id} index={i} label={s.short} />
            ))}
          </Tabs>
        </div>

        <div id={`floor-panel-${idx}`} role="tabpanel" aria-labelledby={`floor-tab-${idx}`} className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Stage */}
          <div className="relative overflow-clip rounded-[28px] bg-card shadow-[inset_0_0_0_1px_rgb(244_241_234/0.07)]">
            <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  station.kind === 'strength'
                    ? 'radial-gradient(60% 55% at 50% 70%, rgb(255 91 20 / 0.16), transparent 70%)'
                    : 'radial-gradient(60% 55% at 50% 70%, rgb(215 255 58 / 0.09), transparent 70%)',
              }}
            />
            <div className="relative flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:gap-4 sm:p-7">
              <div>
                <p className={cn('eyebrow flex items-center gap-2', station.kind === 'strength' ? 'text-brand' : 'text-volt')}>
                  <KindIcon className="size-3.5" aria-hidden="true" />
                  {station.kind === 'strength' ? 'Strength' : 'Cardio'}
                </p>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.h3
                    key={station.id}
                    initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(2px)', transition: spring.moderate.exit }}
                    transition={spring.slow}
                    className="display mt-3 text-[clamp(40px,5.5vw,72px)]"
                    style={{ ['--wd' as string]: 66 }}
                  >
                    {station.name}
                  </motion.h3>
                </AnimatePresence>
              </div>
              <p className="eyebrow shrink-0 rounded-full bg-fg/[0.06] px-3 py-2 text-[11px] text-fg/80 sm:text-xs">{station.count}</p>
            </div>

            <div ref={figure} className="relative mx-auto -mt-4 w-full max-w-[520px] px-4 pb-6">
              <Lifter ref={lifter} prop={rig.prop} label={`Animated athlete on the ${station.name.toLowerCase()}`} />
            </div>

            {/* auto-advance progress */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-fg/[0.06]" aria-hidden="true">
              {auto && !reduced && (
                <div
                  key={`${idx}-${dwell}`}
                  className="h-full origin-left bg-brand animate-[floor-progress_linear_forwards]"
                  style={{ animationDuration: `${dwell}ms`, animationPlayState: inView ? 'running' : 'paused' }}
                />
              )}
            </div>
          </div>

          {/* Photo + details */}
          <div className="flex flex-col gap-3">
            <div className="relative overflow-clip rounded-[28px] bg-card shadow-[inset_0_0_0_1px_rgb(244_241_234/0.07)]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, transition: spring.slow.exit }}
                  transition={spring.slow}
                >
                  <Photo src={station.image} alt={`The ${station.name.toLowerCase()} at the gym`} label={`${station.name} photo`} size="1600 × 1200" className="aspect-[4/3] w-full" />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-1 flex-col rounded-[28px] bg-card p-5 shadow-[inset_0_0_0_1px_rgb(244_241_234/0.07)] sm:p-7">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: spring.moderate.exit }}
                  transition={spring.slow}
                  className="flex flex-1 flex-col"
                >
                  <p className="text-[16px] text-fg/80">{station.line}</p>
                  <p className="eyebrow mt-5 text-muted-foreground">Works</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {station.works.map((w) => (
                      <li key={w} className="rounded-full bg-fg/[0.06] px-3 py-1.5 text-[13px] text-fg/85">
                        {w}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => book({ interest: station.kind === 'strength' ? 'Strength & Powerlifting' : 'Not sure yet', note: station.name })}
                    className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start pt-5 text-[13px] uppercase tracking-[0.08em] text-brand [font-variation-settings:'wght'_700]"
                  >
                    Try it in a free session
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
