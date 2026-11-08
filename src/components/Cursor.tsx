import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'
import { isFinePointer, prefersReducedMotion } from '@/lib/gsap'
import { spring } from '@/lib/springs'

const FOLLOW = { stiffness: 380, damping: 32, mass: 0.5 }

/**
 * A plate that trails the native cursor (which stays visible) and swells
 * over anything clickable. Mouse only, never under reduced motion.
 */
export function Cursor() {
  const [enabled] = useState(() => isFinePointer() && !prefersReducedMotion())
  const [hot, setHot] = useState(false)
  const [hide, setHide] = useState(false)
  const [visible, setVisible] = useState(false)
  const x = useSpring(useMotionValue(-100), FOLLOW)
  const y = useSpring(useMotionValue(-100), FOLLOW)

  useEffect(() => {
    if (!enabled) return
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
      const t = e.target as Element | null
      setHide(!!t?.closest('[data-cursor="none"]'))
      setHot(!!t?.closest('a, button, [role="tab"], [data-cursor]'))
    }
    const leave = () => setVisible(false)
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [enabled, x, y])

  if (!enabled) return null
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[110] -translate-x-1/2 -translate-y-1/2"
      style={{ x, y }}
    >
      <motion.div
        // Over a clickable it becomes a faint halo, so it never sits on a label.
        animate={{ scale: hot ? 2.3 : 1, opacity: !visible || hide ? 0 : hot ? 0.3 : 1 }}
        transition={spring.slow}
        className="grid size-8 place-items-center rounded-full border-[5px] border-[#ff5b14]"
      >
        <motion.span animate={{ opacity: hot ? 0 : 1 }} transition={spring.fast} className="size-1.5 rounded-full bg-[#f4f1ea]" />
      </motion.div>
    </motion.div>
  )
}
