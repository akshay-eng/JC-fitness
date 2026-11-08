import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { Lifter, type LifterHandle } from '@/components/lifter/Lifter'
import { PHASE_LABELS, prime, STATION_RIGS, type StationId } from '@/components/lifter/stations'
import { MagneticButton } from '@/components/MagneticButton'
import { Photo } from '@/components/Photo'
import { WhatsAppIcon } from '@/components/icons'
import { gym, images, stations } from '@/content'
import { gsap, isFinePointer, prefersReducedMotion } from '@/lib/gsap'
import { scrollToId } from '@/lib/scroll'
import { cn } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'

const LINES = [
  { text: 'Lift', className: '' },
  { text: 'Heavy.', className: 'text-outline-fg pl-[0.5em]' },
  { text: 'Live', className: '' },
  { text: 'Loud.', className: 'text-brand pl-[0.9em]' },
]

const FACTS = [
  { k: '4', v: 'Olympic platforms' },
  { k: '5–11', v: 'Open daily, AM to PM' },
  { k: '1st', v: 'Session free' },
]

/** The hero showreel: one rep of each big lift, the equipment swapping in between. */
const REEL: StationId[] = ['clean', 'squat', 'bench', 'deadlift']
const stationOf = (id: StationId) => stations.find((s) => s.id === id)!

/** Shake an element like the floor took the hit. */
function shake(el: HTMLElement | null, power = 6) {
  if (!el) return
  gsap.fromTo(
    el,
    { x: 0, y: 0 },
    {
      keyframes: [
        { x: -power, y: power * 0.5 },
        { x: power * 0.8, y: -power * 0.4 },
        { x: -power * 0.5, y: power * 0.3 },
        { x: power * 0.25, y: 0 },
        { x: 0, y: 0 },
      ],
      duration: 0.32,
      ease: 'power2.out',
    },
  )
}

export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const figure = useRef<HTMLDivElement>(null)
  const lifter = useRef<LifterHandle>(null)
  const [phase, setPhase] = useState('setup')
  const [lift, setLift] = useState<StationId>('clean')
  const liftRef = useRef<StationId>('clean')
  const current = stationOf(lift)

  // Static, readable state for reduced motion: the finished clean & jerk.
  useLayoutEffect(() => {
    const h = lifter.current
    if (prefersReducedMotion() && h) {
      STATION_RIGS.clean.still(h.state)
      h.render()
      setPhase('lockout')
    }
  }, [])

  // Intro + the looping lift, once the preloader hands over.
  useLayoutEffect(() => {
    if (!ready || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const intro = gsap.timeline()
      intro
        .fromTo('[data-hchar]', { yPercent: 115 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.03 })
        .fromTo('[data-hchar]', { '--wd': 125 }, { '--wd': 62, duration: 1.3, ease: 'expo.out', stagger: 0.03 }, 0)
        .fromTo('[data-hfade]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, 0.35)
        .fromTo(stage.current, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out' }, 0.2)

      const h = lifter.current
      if (!h) return
      let rep: gsap.core.Animation | null = null
      let visible = true
      let alive = true

      const play = (i: number) => {
        if (!alive) return
        const id = REEL[i % REEL.length]
        // The equipment is React-rendered: commit the new prop before posing the rig in it.
        if (liftRef.current !== id) {
          liftRef.current = id
          flushSync(() => setLift(id))
        }
        prime(h, id)
        const tl = STATION_RIGS[id].play(h, {
          onImpact: () => {
            shake(stage.current, 9)
            shake(title.current, 3)
          },
        }) as gsap.core.Timeline
        // Phase ticker under the stage follows the timeline's labels.
        Object.entries(tl.labels).forEach(([name, time]) => tl.call(() => setPhase(name), [], time))
        tl.eventCallback('onComplete', () => {
          // Fade the athlete out, swap the equipment, fade back in on the next lift.
          gsap.to(figure.current, {
            opacity: 0,
            scale: 0.97,
            duration: 0.22,
            ease: 'power2.in',
            onComplete: () => {
              play(i + 1)
              gsap.to(figure.current, { opacity: 1, scale: 1, duration: 0.4, ease: 'expo.out' })
            },
          })
        })
        if (!visible) tl.pause()
        rep = tl
      }
      gsap.delayedCall(0.6, () => play(0))

      // Pause when the hero is off screen: no work nobody sees.
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting
        if (visible) rep?.resume()
        else rep?.pause()
      })
      if (root.current) io.observe(root.current)
      return () => {
        alive = false
        io.disconnect()
        rep?.kill()
      }
    }, root)
    return () => ctx.revert()
  }, [ready])

  // Letters near the pointer widen: the headline flexes like a muscle.
  useEffect(() => {
    const el = title.current
    if (!el || !isFinePointer() || prefersReducedMotion()) return
    const chars = Array.from(el.querySelectorAll<HTMLElement>('[data-hchar]'))
    const setters = chars.map((c) => gsap.quickTo(c, '--wd', { duration: 0.5, ease: 'power3.out' }))
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        chars.forEach((c, i) => {
          const r = c.getBoundingClientRect()
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2))
          const f = Math.max(0, 1 - d / 220)
          setters[i](62 + f * f * 58)
        })
      })
    }
    const onLeave = () => setters.forEach((s) => s(62))
    const zone = root.current
    zone?.addEventListener('pointermove', onMove)
    zone?.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      zone?.removeEventListener('pointermove', onMove)
      zone?.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section ref={root} id="top" aria-labelledby="hero-title" className="relative overflow-clip px-[var(--gutter)] pt-24 pb-16 lg:pt-20">
      {/* Optional photo of your floor behind everything: drop public/images/hero.jpg in. */}
      <Photo
        src={images.hero}
        alt=""
        placeholder={false}
        priority
        className="pointer-events-none absolute inset-0"
        imgClassName="opacity-[0.22] grayscale contrast-125 [mask-image:linear-gradient(to_bottom,#000_40%,transparent)]"
      />
      {/* ambient layer */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_60%,#000_10%,transparent_70%)]" />
        <div className="absolute right-[-10%] bottom-[-20%] h-[80vmax] w-[80vmax] rounded-full bg-[radial-gradient(circle,rgb(255_91_20/0.28),transparent_60%)]" />
        <div className="absolute top-[10%] left-[-20%] h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgb(215_255_58/0.06),transparent_60%)]" />
      </div>

      {/* Phones: headline, lifter, then copy, so the lift is on the first screen. md+: copy left, lifter right. */}
      <div className="container-x relative grid min-h-[calc(100svh-120px)] grid-cols-1 content-center md:grid-cols-[1.05fr_0.95fr] md:gap-x-4">
        <div className="relative z-10 md:col-start-1 md:row-start-1 md:self-end">
          <p data-hfade className="eyebrow mb-6 flex items-center gap-2.5 text-muted-foreground">
            <span className="live-dot size-2 rounded-full bg-volt" aria-hidden="true" />
            {gym.tagline} · {gym.address.mapQuery}
          </p>

          <h1
            ref={title}
            id="hero-title"
            aria-label="Lift heavy. Live loud."
            className="display display-italic text-[clamp(76px,21vw,120px)] md:text-[11.2vw] lg:text-[clamp(96px,8.6vw,150px)]"
            style={{ ['--wd' as string]: 62, ['--wg' as string]: 900 }}
          >
            {LINES.map((line) => (
              <span key={line.text} aria-hidden="true" className={cn('block overflow-clip pr-[0.1em] pb-[0.04em]', line.className)}>
                {Array.from(line.text).map((ch, i) => (
                  <span key={i} data-hchar className="inline-block will-change-transform" style={{ ['--wd' as string]: 62 }}>
                    <span style={{ fontVariationSettings: "'wdth' var(--wd), 'wght' 900" }}>{ch}</span>
                  </span>
                ))}
              </span>
            ))}
          </h1>
        </div>

        <div className="relative z-10 md:col-start-1 md:row-start-2 md:self-start">
          <p data-hfade className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-fg/80 sm:text-lg">
            Olympic platforms, a serious strength floor and coaches who track your numbers.
            Your first session at {gym.name} is free.
          </p>

          <div data-hfade className="mt-8 flex flex-wrap items-center gap-3">
            <MagneticButton href={waLink(`Hi ${gym.name}! I'd like to book my free first session.`)} external variant="brand" icon={<ArrowUpRight className="size-4" aria-hidden="true" />}>
              <WhatsAppIcon size={18} />
              Book free session
            </MagneticButton>
            <MagneticButton variant="outline" onClick={() => scrollToId('lift-lab')}>
              Try the Lift Lab
            </MagneticButton>
          </div>

          <dl data-hfade className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-fg/10 pt-6">
            {FACTS.map((f) => (
              <div key={f.v}>
                <dt className="sr-only">{f.v}</dt>
                <dd className="display text-4xl text-fg sm:text-5xl" style={{ ['--wd' as string]: 62 }}>
                  {f.k}
                </dd>
                <dd className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div ref={stage} className="relative row-start-2 mx-auto mt-2 w-full max-w-[380px] md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0 md:max-w-[560px] md:self-center lg:max-w-none">
          <span
            aria-hidden="true"
            className="display text-outline pointer-events-none absolute inset-x-0 top-[8%] text-center text-[clamp(160px,34vw,420px)] leading-none text-fg/[0.14] select-none"
            style={{ ['--wd' as string]: 62 }}
          >
            JC
          </span>
          <div ref={figure} className="relative">
            <Lifter
              ref={lifter}
              prop={STATION_RIGS[lift].prop}
              label={`Animated athlete performing a ${current.name.toLowerCase()}`}
              className="drop-shadow-[0_30px_60px_rgb(255_91_20/0.25)]"
            />
          </div>
          <div className="relative -mt-2 flex items-center justify-between gap-4 border-t border-fg/10 pt-4 lg:mr-20">
            <div>
              <p className="eyebrow text-muted-foreground">{current.name}</p>
              <p className="display mt-1 text-3xl tabular" style={{ ['--wd' as string]: 62 }}>
                {current.demoKg} <span className="text-brand">kg</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden gap-1.5 sm:flex" aria-hidden="true">
                {REEL.map((id) => (
                  <span key={id} className={cn('h-1 w-5 rounded-full transition-colors duration-200', id === lift ? 'bg-brand' : 'bg-fg/15')} />
                ))}
              </div>
            <p aria-live="off" className="eyebrow flex items-center gap-2 text-fg">
              <span className={cn('size-2 rounded-full', phase === 'lockout' ? 'bg-volt' : 'bg-brand')} aria-hidden="true" />
              {PHASE_LABELS[phase] ?? 'Set up'}
            </p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollToId('lift')}
        className="eyebrow absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-muted-foreground hover:text-fg md:inline-flex"
      >
        Scroll to lift
        <ArrowDown className="size-4 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
      </button>
    </section>
  )
}
