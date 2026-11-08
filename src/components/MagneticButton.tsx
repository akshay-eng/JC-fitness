import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { useRef, type ReactNode, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'

/**
 * Deliberately outside the FF spring tiers: a magnet should lag the pointer
 * like a loaded cable, not snap. Hoisted here so it is defined once.
 */
const MAGNET = { stiffness: 260, damping: 18, mass: 0.6 }

type Variant = 'brand' | 'outline' | 'wa' | 'volt'

const styles: Record<Variant, string> = {
  brand: 'bg-brand text-bg hover:bg-brand-hot',
  volt: 'bg-volt text-bg hover:brightness-95',
  outline: 'text-fg shadow-[inset_0_0_0_1.5px_rgb(244_241_234/0.35)] hover:shadow-[inset_0_0_0_1.5px_var(--fg)] hover:bg-fg/5',
  wa: 'bg-wa text-[#06240f] hover:brightness-105',
}

type Props = {
  children: ReactNode
  variant?: Variant
  href?: string
  onClick?: (e: MouseEvent) => void
  className?: string
  icon?: ReactNode
  /** Pull strength as a fraction of the pointer's offset from centre. */
  strength?: number
  type?: 'button' | 'submit'
  ariaLabel?: string
  external?: boolean
}

export function MagneticButton({
  children,
  variant = 'brand',
  href,
  onClick,
  className,
  icon,
  strength = 0.28,
  type = 'button',
  ariaLabel,
  external,
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const x = useSpring(useMotionValue(0), MAGNET)
  const y = useSpring(useMotionValue(0), MAGNET)
  const ix = useSpring(useMotionValue(0), MAGNET)
  const iy = useSpring(useMotionValue(0), MAGNET)

  const move = (e: MouseEvent) => {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    x.set(dx * strength)
    y.set(dy * strength)
    // The label travels further than the shell: parallax inside the button.
    ix.set(dx * strength * 0.35)
    iy.set(dy * strength * 0.35)
  }
  const leave = () => {
    x.set(0)
    y.set(0)
    ix.set(0)
    iy.set(0)
  }

  const cls = cn(
    'group relative inline-flex min-h-12 select-none items-center justify-center gap-2.5 rounded-full px-6 py-3 text-[15px] uppercase tracking-[0.06em]',
    '[font-variation-settings:"wdth"_100,"wght"_700] transition-[transform,box-shadow,filter] duration-150 ease-[var(--ease-out)]',
    styles[variant],
    className,
  )

  const inner = (
    <motion.span style={{ x: ix, y: iy }} className="relative inline-flex items-center gap-2.5">
      {children}
      {icon && <span className="inline-flex transition-transform duration-150 ease-[var(--ease-out)] group-hover:translate-x-0.5">{icon}</span>}
    </motion.span>
  )

  const common = {
    onMouseMove: move,
    onMouseLeave: leave,
    style: { x, y },
    whileTap: { scale: 0.98 },
    className: cls,
    'aria-label': ariaLabel,
    'data-cursor': 'hover',
  }

  if (href) {
    return (
      <motion.a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...common}
      >
        {inner}
      </motion.a>
    )
  }
  return (
    <motion.button ref={ref as React.Ref<HTMLButtonElement>} type={type} onClick={onClick} {...common}>
      {inner}
    </motion.button>
  )
}
