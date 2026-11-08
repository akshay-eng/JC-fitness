import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { RotateCcw, Trash2, Trophy } from 'lucide-react'
import { BarbellFront, PLATE_SPECS, PLATE_WEIGHTS, SLEEVE, sleeveUsed, type LoadedPlate } from '@/components/BarbellFront'
import { KineticHeading } from '@/components/KineticHeading'
import { Lifter, type LifterHandle } from '@/components/lifter/Lifter'
import { cleanAndJerk, missedLift, POSES } from '@/components/lifter/timelines'
import { MagneticButton } from '@/components/MagneticButton'
import { WhatsAppIcon } from '@/components/icons'
import { gym, liftTitles } from '@/content'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { spring } from '@/lib/springs'
import { store } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'

type Phase = 'idle' | 'charging' | 'lifting'
type Result = { ok: boolean; kg: number; title?: string; pr?: boolean; early?: boolean } | null

const BAR = 20
const MAX_LOAD = 300
const BEST_KEY = 'jc-lift-best'

/** Difficulty: 0 at an empty bar, 1 at 300 kg. */
const strainOf = (kg: number) => Math.min(1, Math.max(0, (kg - BAR) / (MAX_LOAD - BAR)))
const zoneWidth = (kg: number) => 0.3 - strainOf(kg) * 0.24
/** Needle sweeps per second (up and back down is one sweep pair). */
const needleSpeed = (kg: number) => 0.6 + strainOf(kg) * 1.15
const titleFor = (kg: number) => liftTitles.find((t) => kg >= t.min)?.title ?? liftTitles[liftTitles.length - 1].title

/* Gauge geometry: a 240° arc open at the bottom. */
const G = { cx: 110, cy: 110, r: 98, a0: 150, sweep: 240 }
const angleAt = (p: number) => G.a0 + G.sweep * p
const pt = (deg: number, r = G.r) => {
  const a = (deg * Math.PI) / 180
  return { x: G.cx + r * Math.cos(a), y: G.cy + r * Math.sin(a) }
}
const arc = (p0: number, p1: number, r = G.r) => {
  const s = pt(angleAt(p0), r)
  const e = pt(angleAt(p1), r)
  const large = G.sweep * (p1 - p0) > 180 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

let plateId = 0

export function LiftLab() {
  const [plates, setPlates] = useState<LoadedPlate[]>(() => [
    { id: ++plateId, w: 25 },
    { id: ++plateId, w: 15 },
  ])
  const [phase, setPhaseState] = useState<Phase>('idle')
  // Pointer-up and lost-capture fire in the same tick: guard on a ref, not on stale state.
  const phaseRef = useRef<Phase>('idle')
  const setPhase = (p: Phase) => {
    phaseRef.current = p
    setPhaseState(p)
  }
  const [result, setResult] = useState<Result>(null)
  const [best, setBest] = useState<number>(() => Number(store.get(BEST_KEY)) || 0)
  const [zone, setZone] = useState({ c: 0.72 })

  const lifter = useRef<LifterHandle>(null)
  const stage = useRef<HTMLDivElement>(null)
  const needle = useRef<SVGGElement>(null)
  const meter = useRef({ p: 0, dir: 1 })
  const tl = useRef<gsap.core.Timeline | null>(null)

  const weights = plates.map((p) => p.w)
  const total = BAR + weights.reduce((a, b) => a + b, 0) * 2
  const w = zoneWidth(total)
  const z0 = Math.max(0.05, zone.c - w / 2)
  const z1 = Math.min(0.98, zone.c + w / 2)
  const busy = phase !== 'idle'

  const heaviest = weights.length ? Math.max(...weights) : 0
  const plateColor = heaviest ? PLATE_SPECS[heaviest].color : 'rgb(244 241 234 / 0.25)'
  const plateStroke = 6 + Math.min(weights.length, 7) * 2.4

  const canAdd = (pw: number) => !busy && total + pw * 2 <= MAX_LOAD && sleeveUsed([...weights, pw]) <= SLEEVE

  const add = (pw: number) => {
    if (!canAdd(pw)) return
    setPlates((p) => [...p, { id: ++plateId, w: pw }])
    setResult(null)
  }
  const undo = () => {
    if (busy) return
    // Off comes the lightest (outermost) plate.
    setPlates((p) => {
      if (!p.length) return p
      const sorted = [...p].sort((a, b) => b.w - a.w || a.id - b.id)
      const last = sorted[sorted.length - 1]
      return p.filter((x) => x.id !== last.id)
    })
    setResult(null)
  }
  const clear = () => {
    if (busy) return
    setPlates([])
    setResult(null)
  }

  const renderNeedle = useCallback(() => {
    const p = meter.current.p
    needle.current?.setAttribute('transform', `rotate(${angleAt(p).toFixed(2)} ${G.cx} ${G.cy})`)
  }, [])

  // Needle loop while charging.
  useEffect(() => {
    if (phase !== 'charging') return
    const speed = needleSpeed(total)
    const tick = (_t: number, dt: number) => {
      const m = meter.current
      m.p += m.dir * speed * (dt / 1000) * 2
      if (m.p >= 1) {
        m.p = 1
        m.dir = -1
      } else if (m.p <= 0) {
        m.p = 0
        m.dir = 1
      }
      renderNeedle()
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [phase, total, renderNeedle])

  useEffect(() => renderNeedle(), [renderNeedle])
  useEffect(() => () => void tl.current?.kill(), [])

  const start = () => {
    const h = lifter.current
    if (phaseRef.current !== 'idle' || !h) return
    tl.current?.kill()
    meter.current = { p: 0, dir: 1 }
    setZone({ c: 0.6 + Math.random() * 0.25 })
    setResult(null)
    setPhase('charging')
    h.snap(POSES.setup)
    h.state.free = 0
    h.state.lights = 0
    h.state.red = 0
    // Tension before the pull: hips sink, the body starts to shake.
    gsap.to(h.state, { ...POSES.wedge, shake: 0.6 + strainOf(total) * 2.6, duration: 0.5, ease: 'sine.out', onUpdate: h.render })
    if (stage.current && !prefersReducedMotion()) gsap.to(stage.current, { '--charge': 1, duration: 1.2, ease: 'sine.out' })
  }

  const release = () => {
    const h = lifter.current
    if (phaseRef.current !== 'charging' || !h) return
    const p = meter.current.p
    const ok = p >= z0 && p <= z1
    setPhase('lifting')
    gsap.killTweensOf(h.state)
    h.state.shake = 0
    if (stage.current) gsap.to(stage.current, { '--charge': 0, duration: 0.4 })
    const kg = total

    if (ok) {
      const title = titleFor(kg)
      const pr = kg > best
      tl.current = cleanAndJerk(h, {
        holds: false,
        speed: 1.25 - strainOf(kg) * 0.4,
        onCatch: () => stage.current && gsap.fromTo(stage.current, { y: 0 }, { y: 4, duration: 0.06, yoyo: true, repeat: 1 }),
        onLockout: () => {
          setResult({ ok: true, kg, title, pr })
          if (pr) {
            setBest(kg)
            store.set(BEST_KEY, String(kg))
          }
        },
        onDrop: () => stage.current && gsap.fromTo(stage.current, { x: 0 }, { keyframes: [{ x: -8 }, { x: 6 }, { x: -3 }, { x: 0 }], duration: 0.3 }),
      })
      tl.current.eventCallback('onComplete', () => setPhase('idle'))
    } else {
      // Early only if the needle was still on its way up to the zone.
      setResult({ ok: false, kg, early: meter.current.dir === 1 && p < z0 })
      tl.current = missedLift(h, strainOf(kg))
      tl.current.eventCallback('onComplete', () => setPhase('idle'))
    }
  }

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault()
      start()
    }
  }
  const onKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      release()
    }
  }

  const label = phase === 'charging' ? 'Let go in the zone' : phase === 'lifting' ? 'Lifting…' : result ? 'Lift again' : 'Hold to lift'

  return (
    <section id="lift-lab" aria-labelledby="lab-title" className="section">
      <div className="container-x">
        <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow mb-5 flex items-center gap-2 text-volt">
              <span className="live-dot size-2 rounded-full bg-volt" aria-hidden="true" />
              Lift Lab · interactive
            </p>
            <KineticHeading id="lab-title" lines={['Load the bar.', { text: 'Hit your PR.', className: 'text-brand' }]} className="text-[clamp(52px,9.5vw,124px)]" />
          </div>
          <p className="max-w-sm text-fg/70 lg:pb-3">
            Stack plates, then press and hold. Let go while the needle is in the green zone. Heavier bars move the needle faster and shrink the zone.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Stage */}
          <div
            ref={stage}
            className="relative order-2 overflow-clip rounded-[28px] bg-card shadow-[inset_0_0_0_1px_rgb(244_241_234/0.07)] lg:order-1"
            style={{ ['--charge' as string]: 0 }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(60% 50% at 50% 70%, rgb(255 91 20 / calc(0.08 + var(--charge) * 0.3)), transparent 70%)' }}
            />
            <div className="grid-lines pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />

            <div className="relative flex items-start justify-between gap-4 p-5 sm:p-7">
              <div>
                <p className="eyebrow text-muted-foreground">Platform 1</p>
                <p className="display mt-2 text-[clamp(48px,7vw,84px)] tabular" style={{ ['--wd' as string]: 62 }} aria-live="polite">
                  {total}
                  <span className="ml-1 text-[0.45em] text-brand">kg</span>
                </p>
              </div>
              <div className="text-right">
                <p className="eyebrow flex items-center justify-end gap-1.5 text-muted-foreground">
                  <Trophy className="size-3.5 text-volt" aria-hidden="true" />
                  Your best
                </p>
                <p className="display mt-2 text-4xl tabular" style={{ ['--wd' as string]: 62 }}>
                  {best ? `${best}` : '—'}
                  {best > 0 && <span className="ml-1 text-lg text-muted-foreground">kg</span>}
                </p>
              </div>
            </div>

            <div className="relative grid items-center md:grid-cols-[1fr_auto] md:pr-4">
            <div className="relative mx-auto -mt-6 w-full max-w-[420px] px-4 md:-mt-10">
              <Lifter
                ref={lifter}
                plateColor={plateColor}
                plateStroke={plateStroke}
                label={`Lifter at the bar with ${total} kilograms loaded`}
              />
              <AnimatePresence>
                {result && phase !== 'charging' && (
                  <motion.div
                    key={`${result.ok}-${result.kg}`}
                    initial={{ opacity: 0, scale: 1.6, rotate: -14 }}
                    animate={{ opacity: 1, scale: 1, rotate: -8 }}
                    exit={{ opacity: 0, transition: spring.moderate.exit }}
                    transition={{ ...spring.slow, bounce: 0.4 }}
                    className={cn(
                      'display display-italic pointer-events-none absolute top-[18%] left-4 rounded-lg px-3 py-1 text-[clamp(30px,5vw,48px)] shadow-[inset_0_0_0_3px_currentColor]',
                      result.ok ? 'text-volt' : 'text-no-lift',
                    )}
                    style={{ ['--wd' as string]: 70 }}
                  >
                    {result.ok ? (result.pr ? 'New PR!' : 'Good lift') : 'No lift'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Gauge + hold button */}
            <div className="relative flex flex-col items-center px-5 pb-7 sm:px-7 md:px-0">
              <div className="relative size-[220px]">
                <svg viewBox="0 0 220 220" className="absolute inset-0" aria-hidden="true">
                  <path d={arc(0, 1)} fill="none" stroke="rgb(244 241 234 / 0.1)" strokeWidth={12} strokeLinecap="round" />
                  <path d={arc(z0, z1)} fill="none" stroke="var(--volt)" strokeWidth={12} strokeLinecap="round" className="transition-[d] duration-200" />
                  {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                    const a = pt(angleAt(t), G.r - 14)
                    const b = pt(angleAt(t), G.r - 20)
                    return <line key={t} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgb(244 241 234 / 0.3)" strokeWidth={2} />
                  })}
                  <g ref={needle}>
                    <line x1={G.cx + G.r - 18} y1={G.cy} x2={G.cx + G.r + 8} y2={G.cy} stroke="var(--fg)" strokeWidth={4} strokeLinecap="round" />
                    <circle cx={G.cx + G.r} cy={G.cy} r={5} fill="var(--brand)" />
                  </g>
                </svg>
                <button
                  type="button"
                  onPointerDown={onPointerDown}
                  onPointerUp={release}
                  onPointerCancel={release}
                  onLostPointerCapture={release}
                  onKeyDown={onKeyDown}
                  onKeyUp={onKeyUp}
                  onBlur={release}
                  onContextMenu={(e) => e.preventDefault()}
                  disabled={phase === 'lifting'}
                  aria-describedby="lab-help"
                  data-cursor="none"
                  className={cn(
                    'absolute top-1/2 left-1/2 grid size-[136px] -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full px-4 text-center select-none [-webkit-touch-callout:none]',
                    'display text-[22px] leading-[0.95] transition-[transform,background-color,box-shadow] duration-150 ease-[var(--ease-out)]',
                    phase === 'charging'
                      ? 'scale-[0.96] bg-brand-hot text-bg shadow-[0_0_0_10px_rgb(255_91_20/0.18),0_0_60px_rgb(255_91_20/0.5)]'
                      : 'bg-brand text-bg shadow-[0_0_0_6px_rgb(255_91_20/0.12)] hover:bg-brand-hot',
                    phase === 'lifting' && 'opacity-60',
                  )}
                  style={{ ['--wd' as string]: 72 }}
                >
                  {label}
                </button>
              </div>
              <p id="lab-help" className="mt-3 max-w-[240px] text-center text-[13px] text-muted-foreground">
                Hold with mouse, finger, or the space bar. Zone: {Math.round(w * 100)}% of the dial.
              </p>
            </div>
            </div>
          </div>

          {/* Loader + result */}
          <div className="order-1 flex flex-col gap-3 lg:order-2">
            <div className="rounded-[28px] bg-card p-5 shadow-[inset_0_0_0_1px_rgb(244_241_234/0.07)] sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow text-muted-foreground">Step 1 · Load the bar</p>
                <div className="flex gap-1">
                  <IconBtn label="Remove the outer plates" onClick={undo} disabled={busy || !plates.length}>
                    <RotateCcw className="size-4" />
                  </IconBtn>
                  <IconBtn label="Strip the bar" onClick={clear} disabled={busy || !plates.length}>
                    <Trash2 className="size-4" />
                  </IconBtn>
                </div>
              </div>
              <div className="py-4">
                <BarbellFront plates={plates} live label={`Barbell loaded to ${total} kilograms`} />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6" role="group" aria-label="Add a pair of plates">
                {PLATE_WEIGHTS.map((pw) => {
                  const spec = PLATE_SPECS[pw]
                  return (
                    <motion.button
                      key={pw}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => add(pw)}
                      disabled={!canAdd(pw)}
                      aria-label={`Add a pair of ${pw} kilogram plates`}
                      className="group flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-fg/[0.04] py-2 shadow-[inset_0_0_0_1px_rgb(244_241_234/0.06)] hover:bg-fg/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <span
                        className="h-7 rounded-[3px] transition-transform duration-150 ease-[var(--ease-out)] group-hover:-translate-y-0.5"
                        style={{ background: spec.color, width: Math.max(6, spec.thick / 2.2), height: spec.h / 5.5 }}
                        aria-hidden="true"
                      />
                      <span className="display text-xl tabular" style={{ ['--wd' as string]: 70 }}>
                        {pw}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
              <p className="mt-3 text-[13px] text-muted-foreground">Each tap adds a pair. Bar is {BAR} kg. Max {MAX_LOAD} kg.</p>
            </div>

            <div className="relative flex-1 overflow-clip rounded-[28px] bg-card p-5 shadow-[inset_0_0_0_1px_rgb(244_241_234/0.07)] sm:p-7" aria-live="polite">
              <p className="eyebrow text-muted-foreground">Step 2 · Your result</p>
              <AnimatePresence mode="popLayout" initial={false}>
                {result?.ok ? (
                  <motion.div key="ok" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: spring.moderate.exit }} transition={spring.slow} className="mt-4">
                    <p className="display text-[clamp(40px,4vw,56px)]" style={{ ['--wd' as string]: 66 }}>
                      {result.title}
                    </p>
                    <p className="mt-2 text-fg/75">
                      Clean &amp; jerk, {result.kg} kg.{result.pr ? ' A new personal best.' : ''} Bring that number to the platform and a coach will help you beat it.
                    </p>
                    <div className="mt-5">
                      <MagneticButton
                        variant="wa"
                        external
                        href={waLink(`Hi ${gym.name}! I just clean & jerked ${result.kg} kg in the Lift Lab (${result.title}). I'd like to book my free session.`)}
                        className="w-full sm:w-auto"
                      >
                        <WhatsAppIcon size={18} />
                        Claim my free session
                      </MagneticButton>
                    </div>
                  </motion.div>
                ) : result && !result.ok ? (
                  <motion.div key="fail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: spring.moderate.exit }} transition={spring.slow} className="mt-4">
                    <p className="display text-[clamp(40px,4vw,56px)] text-no-lift" style={{ ['--wd' as string]: 66 }}>
                      Three red lights
                    </p>
                    <p className="mt-2 text-fg/75">
                      {result.early ? 'You let go before the zone. Wait for the needle to reach the green.' : 'You held past the zone. Let go the moment the needle lands in the green.'} Strip a plate or go again.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: spring.moderate.exit }} transition={spring.moderate} className="mt-4">
                    <p className="display text-[clamp(40px,4vw,56px)] text-fg/30" style={{ ['--wd' as string]: 66 }}>
                      Waiting on you
                    </p>
                    <p className="mt-2 text-fg/60">Load the bar, then hold the orange button. Good lifts earn a title, from Warm-up Hero to Gravity&apos;s Problem.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-11 place-items-center rounded-full text-fg/70 hover:bg-fg/[0.06] hover:text-fg disabled:opacity-30"
    >
      {children}
    </button>
  )
}
