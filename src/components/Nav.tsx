import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { FluidHoverHighlight } from '@/components/fluid-hover-highlight'
import { useFluidHover, useRegisterFluidHoverItem } from '@/hooks/use-fluid-hover'
import { gym } from '@/content'
import { fontWeights } from '@/lib/font-weight'
import { lockScroll, scrollToId } from '@/lib/scroll'
import { spring } from '@/lib/springs'
import { cn } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'
import { WhatsAppIcon } from './icons'
import { Logo } from './Logo'

const LINKS = [
  { id: 'programs', label: 'Programs' },
  { id: 'floor', label: 'The Floor' },
  { id: 'lift-lab', label: 'Lift Lab' },
  { id: 'events', label: 'Events' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'contact', label: 'Contact' },
]

const FREE_SESSION = `Hi ${gym.name}! I'd like to book my free first session.`

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    LINKS.forEach((l) => {
      const el = document.getElementById(l.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])
  return active
}

export function Nav() {
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const active = useActiveSection()
  const listRef = useRef<HTMLUListElement>(null)
  const hover = useFluidHover(listRef, { axis: 'x' })

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setSolid(y > 40)
    setHidden(y > 400 && y > prev && !open)
  })

  useEffect(() => {
    lockScroll(open)
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id: string) => {
    setOpen(false)
    scrollToId(id)
  }

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden ? '-110%' : '0%' }}
        transition={hidden ? spring.moderate.exit : spring.moderate}
        className={cn(
          'fixed inset-x-0 top-0 z-[70] px-[var(--gutter)]',
          solid && 'bg-bg/75 shadow-[0_1px_0_rgb(244_241_234/0.08)] backdrop-blur-xl',
        )}
      >
        <nav aria-label="Main" className="container-x flex h-16 items-center justify-between gap-3 sm:gap-6">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              go('top')
            }}
            aria-label={`${gym.name}, back to top`}
            className="shrink-0"
          >
            <Logo />
          </a>

          <ul ref={listRef} {...hover.handlers} className="relative hidden items-center xl:flex">
            <FluidHoverHighlight hover={hover} className="rounded-full" />
            {LINKS.map((l, i) => (
              <NavItem key={l.id} index={i} register={hover.registerItem} active={active === l.id} onGo={() => go(l.id)} {...l} />
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href={waLink(FREE_SESSION)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-3.5 text-[11px] uppercase tracking-[0.06em] whitespace-nowrap text-bg [font-variation-settings:'wght'_700] hover:bg-brand-hot max-[359px]:hidden sm:px-5 sm:text-[13px] sm:tracking-[0.08em]"
            >
              Free session
              <ArrowUpRight className="hidden size-4 sm:block" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="grid size-11 place-items-center rounded-full text-fg shadow-[inset_0_0_0_1px_rgb(244_241_234/0.2)] xl:hidden"
            >
              <IconSwap open={open} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: spring.slow.exit }}
            transition={spring.slow}
            className="fixed inset-0 z-[65] flex flex-col bg-bg px-[var(--gutter)] pb-[max(24px,env(safe-area-inset-bottom))] pt-24 xl:hidden"
          >
            <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
            <ul className="relative flex flex-1 flex-col justify-center gap-1">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.slow, delay: 0.04 + i * 0.05 }}
                >
                  <button
                    type="button"
                    onClick={() => go(l.id)}
                    className="display display-italic flex w-full items-baseline gap-4 py-1 text-left text-[clamp(44px,12.5vh,88px)] max-sm:text-[clamp(44px,13vw,80px)] text-fg active:text-brand"
                    style={{ ['--wd' as string]: 62 }}
                  >
                    <span className="eyebrow not-italic text-brand">0{i + 1}</span>
                    {l.label}
                  </button>
                </motion.li>
              ))}
            </ul>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...spring.slow, delay: 0.3 }}
              className="relative flex flex-col gap-3"
            >
              <a
                href={waLink(FREE_SESSION)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-14 items-center justify-center gap-3 rounded-full bg-wa text-[15px] uppercase tracking-[0.06em] text-[#06240f] [font-variation-settings:'wght'_700]"
              >
                <WhatsAppIcon size={20} />
                Book a free session
              </a>
              <p className="text-center text-sm text-muted-foreground">
                {gym.hours[0].days} · {gym.hours[0].time}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavItem({
  id,
  label,
  index,
  register,
  active,
  onGo,
}: {
  id: string
  label: string
  index: number
  register: (i: number, el: HTMLElement | null) => void
  active: boolean
  onGo: () => void
}) {
  const ref = useRef<HTMLLIElement>(null)
  useRegisterFluidHoverItem(register, index, ref as RefObject<HTMLElement | null>)
  return (
    <li ref={ref} className="relative">
      <a
        href={`#${id}`}
        onClick={(e) => {
          e.preventDefault()
          onGo()
        }}
        aria-current={active ? 'location' : undefined}
        className={cn('relative flex h-10 items-center px-4 text-[14px] uppercase tracking-[0.08em]', active ? 'text-fg' : 'text-muted-foreground hover:text-fg')}
      >
        {/* Ghost-span: the heavier weight reserves its width, so neighbours never move. */}
        <span className="inline-grid">
          <span
            className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
            style={{ fontVariationSettings: active ? fontWeights.semibold : fontWeights.normal }}
          >
            {label}
          </span>
          <span aria-hidden="true" className="invisible col-start-1 row-start-1" style={{ fontVariationSettings: fontWeights.semibold }}>
            {label}
          </span>
        </span>
        {active && <motion.span layoutId="nav-dot" transition={spring.moderate} className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand" />}
      </a>
    </li>
  )
}

/** Menu ↔ close: two glyphs in one cell, crossfading with blur and scale. */
function IconSwap({ open }: { open: boolean }) {
  const SHOWN = { opacity: 1, scale: 1, filter: 'blur(0px)' }
  const HIDDEN = { opacity: 0, scale: 0.25, filter: 'blur(4px)' }
  const enter = { type: 'tween' as const, duration: spring.fast.duration, ease: 'easeOut' as const }
  const leave = { type: 'tween' as const, ...spring.fast.exit, ease: 'easeIn' as const }
  return (
    <span className="grid size-5">
      <motion.span className="col-start-1 row-start-1 flex" initial={false} animate={open ? HIDDEN : SHOWN} transition={open ? leave : enter}>
        <Menu className="size-5" aria-hidden="true" />
      </motion.span>
      <motion.span className="col-start-1 row-start-1 flex" initial={false} animate={open ? SHOWN : HIDDEN} transition={open ? enter : leave}>
        <X className="size-5" aria-hidden="true" />
      </motion.span>
    </span>
  )
}
