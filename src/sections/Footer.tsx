import { useLayoutEffect, useRef } from 'react'
import { InstagramIcon, WhatsAppIcon, YouTubeIcon } from '@/components/icons'
import { Logo } from '@/components/Logo'
import { gym } from '@/content'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { scrollToId } from '@/lib/scroll'
import { waLink } from '@/lib/whatsapp'

const LINKS = [
  { id: 'programs', label: 'Programs' },
  { id: 'floor', label: 'The Floor' },
  { id: 'lift-lab', label: 'Lift Lab' },
  { id: 'events', label: 'Events' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'contact', label: 'Contact' },
]

export function Footer() {
  const word = useRef<HTMLParagraphElement>(null)

  // The wordmark fills with orange as you reach the bottom.
  useLayoutEffect(() => {
    const el = word.current
    if (!el || prefersReducedMotion()) {
      el?.style.setProperty('--fill', '100%')
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { '--fill': '0%' },
        { '--fill': '100%', ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: 0.5 } },
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <footer className="relative overflow-clip border-t border-fg/10 px-[var(--gutter)] pt-16 pb-[max(32px,env(safe-area-inset-bottom))]">
      <div className="container-x">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-fg/65">
              {gym.address.line1}, {gym.address.line2}
            </p>
            <div className="mt-6 flex gap-2">
              <a href={gym.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid size-11 place-items-center rounded-full bg-fg/[0.06] hover:bg-brand hover:text-bg">
                <InstagramIcon size={18} />
              </a>
              <a href={gym.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="grid size-11 place-items-center rounded-full bg-fg/[0.06] hover:bg-brand hover:text-bg">
                <YouTubeIcon size={18} />
              </a>
              <a href={waLink(`Hi ${gym.name}!`)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid size-11 place-items-center rounded-full bg-fg/[0.06] hover:bg-wa hover:text-bg">
                <WhatsAppIcon size={18} />
              </a>
            </div>
          </div>
          <nav aria-label="Footer">
            <p className="eyebrow mb-4 text-muted-foreground">Explore</p>
            <ul className="grid gap-1">
              {LINKS.map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToId(l.id)
                    }}
                    className="inline-flex min-h-10 items-center text-fg/80 hover:text-brand"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="eyebrow mb-4 text-muted-foreground">Hours</p>
            <dl className="grid gap-2 text-fg/80">
              {gym.hours.map((h) => (
                <div key={h.days}>
                  <dt className="text-fg/55">{h.days}</dt>
                  <dd>{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <p
          ref={word}
          aria-hidden="true"
          className="display display-italic mt-16 text-center text-[clamp(72px,19vw,300px)] leading-[0.8] select-none"
          style={{
            ['--wd' as string]: 62,
            ['--fill' as string]: '0%',
            color: 'transparent',
            WebkitTextStroke: '1.5px rgb(234 242 247 / 0.25)',
            backgroundImage: 'linear-gradient(90deg, var(--brand) var(--fill), transparent var(--fill))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          {gym.name}
        </p>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-fg/10 pt-6 text-[13px] text-fg/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {gym.name}. All rights reserved.
          </p>
          <p>Lift heavy. Live loud.</p>
        </div>
      </div>
    </footer>
  )
}
