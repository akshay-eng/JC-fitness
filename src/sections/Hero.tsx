import { useEffect, useLayoutEffect, useRef } from 'react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { MagneticButton } from '@/components/MagneticButton'
import { Photo } from '@/components/Photo'
import { WhatsAppIcon } from '@/components/icons'
import { gym, images } from '@/content'
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

/** The panel's angled cut. Kept in one place: CSS classes and the reveal tween share it. */
const CUT = {
  desktop: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)',
  desktopFrom: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
  mobile: 'polygon(0% 0%, 100% 0%, 100% 84%, 0% 100%)',
  mobileFrom: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
}

const RING = 'Lift heavy · Live loud · JC Fitness · Strength club · '

export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const stripe = useRef<HTMLDivElement>(null)
  const photo = useRef<HTMLDivElement>(null)
  const inset = useRef<HTMLDivElement>(null)
  const sticker = useRef<HTMLDivElement>(null)

  // Intro once the preloader hands over: the photo panel wipes in along its cut.
  useLayoutEffect(() => {
    if (!ready || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' }, (c) => {
        const d = c.conditions?.desktop
        const tl = gsap.timeline()
        tl.fromTo(panel.current, { clipPath: d ? CUT.desktopFrom : CUT.mobileFrom }, { clipPath: d ? CUT.desktop : CUT.mobile, duration: 1.1, ease: 'expo.inOut', clearProps: 'clipPath' })
          .fromTo(stripe.current, { clipPath: d ? CUT.desktopFrom : CUT.mobileFrom }, { clipPath: d ? CUT.desktop : CUT.mobile, duration: 1.1, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.08)
          .fromTo(photo.current, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.1)
          .fromTo('[data-hchar]', { yPercent: 115 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.03 }, 0.25)
          .fromTo('[data-hchar]', { '--wd': 125 }, { '--wd': 62, duration: 1.3, ease: 'expo.out', stagger: 0.03 }, 0.25)
          .fromTo('[data-hfade]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, 0.55)
          .fromTo(inset.current, { opacity: 0, scale: 0.7, rotate: -25 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.9, ease: 'back.out(1.6)' }, 0.8)
          .fromTo(sticker.current, { opacity: 0, y: -30, rotate: 8 }, { opacity: 1, y: 0, rotate: -6, duration: 0.7, ease: 'back.out(2)' }, 1.0)
      })
      // The photo drifts slower than the page as you scroll away.
      gsap.to(photo.current, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } })
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
          const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2))
          const f = Math.max(0, 1 - dist / 220)
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
    <section ref={root} id="top" aria-labelledby="hero-title" className="relative isolate min-h-[100svh] overflow-clip">
      {/* Accent stripe: the same cut, nudged out, so a brand edge runs along the diagonal. */}
      <div
        ref={stripe}
        aria-hidden="true"
        className="absolute inset-x-0 top-0 hidden h-[60svh] translate-y-2 bg-[linear-gradient(180deg,var(--brand),var(--volt))] md:[mask-image:linear-gradient(to_bottom,transparent_72px,#000_150px)] [clip-path:polygon(0%_0%,100%_0%,100%_84%,0%_100%)] md:inset-y-0 md:right-0 md:left-auto md:block md:h-auto md:w-[56vw] md:-translate-x-3 md:translate-y-0 md:[clip-path:polygon(20%_0%,100%_0%,100%_100%,0%_100%)]"
      />

      {/* Photo panel */}
      <div
        ref={panel}
        className="absolute inset-x-0 top-0 h-[60svh] overflow-clip bg-card [clip-path:polygon(0%_0%,100%_0%,100%_84%,0%_100%)] md:inset-y-0 md:right-0 md:left-auto md:h-auto md:w-[56vw] md:[clip-path:polygon(20%_0%,100%_0%,100%_100%,0%_100%)]"
      >
        <div ref={photo} className="absolute -inset-y-[6%] inset-x-0 will-change-transform">
          <Photo
            src={images.hero}
            alt="An athlete holding a heavy back squat in a dark gym"
            label="Hero photo"
            size="2000 × 1400"
            priority
            tone="cool"
            className="absolute inset-0"
            imgClassName="object-[58%_35%]"
          />
        </div>
        {/* Blend into the page: down on phones, left on wider screens. */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bg via-bg/25 to-transparent md:bg-gradient-to-r md:from-bg/70 md:via-transparent md:to-transparent" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(70%_60%_at_85%_10%,rgb(59_140_255/0.35),transparent_70%)] mix-blend-screen" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg/80 to-transparent" />
      </div>

      {/* Tape sticker */}
      <div
        ref={sticker}
        className="display display-italic absolute top-[15svh] right-3 z-10 -rotate-6 bg-volt px-3 py-1.5 text-[18px] text-bg shadow-[0_10px_30px_rgb(0_0_0/0.35)] md:top-28 md:right-[6vw] md:px-4 md:py-2 md:text-[28px]"
        style={{ ['--wd' as string]: 70 }}
      >
        First session free
      </div>

      {/* Round close-up, framed like a bumper plate, with a turning ring of text. */}
      <div
        ref={inset}
        className="absolute top-[calc(60svh-300px)] right-3 z-10 size-[140px] md:top-auto md:right-[5vw] md:bottom-[7%] md:size-[200px] xl:right-auto xl:bottom-[6%] xl:left-[calc(44vw-60px)] xl:size-[220px]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 220 220" className="absolute inset-0 animate-[spin_22s_linear_infinite] motion-reduce:animate-none">
          <defs>
            <path id="hero-ring" d="M110,110 m-96,0 a96,96 0 1,1 192,0 a96,96 0 1,1 -192,0" />
          </defs>
          <text fill="var(--fg)" fontSize="14" style={{ fontVariationSettings: "'wdth' 100, 'wght' 650", textTransform: 'uppercase' }}>
            <textPath href="#hero-ring" textLength={600} lengthAdjust="spacing">
              {RING}
            </textPath>
          </text>
        </svg>
        <div className="absolute inset-[17%] rounded-full bg-bg p-[5px] shadow-[0_0_0_4px_var(--brand),0_20px_50px_rgb(0_0_0/0.5)]">
          <Photo src={images.heroDetail} alt="" placeholder={false} className="size-full rounded-full" />
        </div>
      </div>

      {/* Copy */}
      <div className="relative z-[5] px-[var(--gutter)]">
        <div className="container-x flex min-h-[100svh] flex-col justify-end pt-[44svh] pb-16 md:justify-center md:pt-24 md:pb-20">
          <div className="md:max-w-[min(40rem,41vw)]">
            <p data-hfade className="eyebrow mb-6 flex items-center gap-2.5 text-fg/75">
              <span className="live-dot size-2 rounded-full bg-volt" aria-hidden="true" />
              {gym.tagline} · {gym.address.mapQuery}
            </p>

            <h1
              ref={title}
              id="hero-title"
              aria-label="Lift heavy. Live loud."
              className="display display-italic text-[clamp(76px,21vw,120px)] drop-shadow-[0_4px_30px_rgb(0_0_0/0.45)] md:text-[10.4vw] lg:text-[clamp(96px,8.6vw,150px)]"
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

            <p data-hfade className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-fg/80 sm:text-lg">
              Olympic platforms, a serious strength floor and coaches who know your numbers. Come train with us: your first session at {gym.name} is free.
            </p>

            <div data-hfade className="mt-8 flex flex-wrap items-center gap-3">
              <MagneticButton href={waLink(`Hi ${gym.name}! I'd like to book my free first session.`)} external variant="brand" icon={<ArrowUpRight className="size-4" aria-hidden="true" />}>
                <WhatsAppIcon size={18} />
                Book free session
              </MagneticButton>
              <MagneticButton variant="outline" onClick={() => scrollToId('floor')}>
                See the floor
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
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollToId('lift')}
        className="eyebrow absolute bottom-6 left-[var(--gutter)] z-10 hidden items-center gap-2 text-muted-foreground hover:text-fg md:inline-flex"
      >
        Scroll
        <ArrowDown className="size-4 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
      </button>
    </section>
  )
}
