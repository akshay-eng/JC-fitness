import { AnimatePresence, motion } from 'motion/react'
import { spring } from '@/lib/springs'
import { cn } from '@/lib/utils'

export const PLATE_SPECS: Record<number, { color: string; thick: number; h: number; label: string; ink: string }> = {
  25: { color: 'var(--plate-25)', thick: 26, h: 150, label: '25', ink: '#fff' },
  20: { color: 'var(--plate-20)', thick: 22, h: 150, label: '20', ink: '#fff' },
  15: { color: 'var(--plate-15)', thick: 18, h: 150, label: '15', ink: '#111' },
  10: { color: 'var(--plate-10)', thick: 15, h: 150, label: '10', ink: '#fff' },
  5: { color: 'var(--plate-5)', thick: 11, h: 98, label: '5', ink: '#111' },
  2.5: { color: 'var(--plate-2)', thick: 9, h: 76, label: '2.5', ink: '#111' },
}

export const PLATE_WEIGHTS = [25, 20, 15, 10, 5, 2.5] as const

const CY = 100
const COLLAR_L = 196
const COLLAR_R = 444
const GAP = 1.5
/** Usable sleeve length, in SVG units. */
export const SLEEVE = 176

export type LoadedPlate = { id: number; w: number }

type Props = {
  /** Plates on each side. Laid out heaviest-in, the way a coach loads a bar. */
  plates: Array<number | LoadedPlate>
  className?: string
  /** Spring plates on and off (Lift Lab). Off: static, for GSAP to drive. */
  live?: boolean
  label?: string
}

export const sleeveUsed = (weights: number[]) => weights.reduce((a, w) => a + PLATE_SPECS[w].thick + GAP, 0)

/** A barbell seen from the front, plates stacking out from the collars. */
export function BarbellFront({ plates, className, live = false, label = 'Barbell' }: Props) {
  const list = plates
    .map((p, i) => (typeof p === 'number' ? { id: i, w: p } : p))
    .sort((a, b) => b.w - a.w || a.id - b.id)
  let off = 0
  const items = list.map((p) => {
    const spec = PLATE_SPECS[p.w]
    const item = { ...p, spec, off }
    off += spec.thick + GAP
    return item
  })

  return (
    <svg viewBox="0 0 640 200" className={cn('block h-auto w-full overflow-visible', className)} role="img" aria-label={label}>
      <defs>
        <pattern id="knurl" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 4 4 0M-1 1 1-1M3 5 5 3" stroke="#6d6a63" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect x={COLLAR_L} y={CY - 4} width={COLLAR_R - COLLAR_L} height={8} rx={2} fill="#b9b6ae" />
      <rect x={COLLAR_L + 70} y={CY - 4} width={COLLAR_R - COLLAR_L - 140} height={8} fill="url(#knurl)" opacity={0.6} />
      <rect x={12} y={CY - 7} width={COLLAR_L - 12} height={14} rx={3} fill="#d9d6ce" />
      <rect x={COLLAR_R} y={CY - 7} width={640 - 12 - COLLAR_R} height={14} rx={3} fill="#d9d6ce" />
      <rect x={COLLAR_L - 8} y={CY - 14} width={8} height={28} rx={2} fill="#efece4" />
      <rect x={COLLAR_R} y={CY - 14} width={8} height={28} rx={2} fill="#efece4" />

      {[-1, 1].map((side) => {
        const at = (it: (typeof items)[number]) => (side < 0 ? COLLAR_L - 8 - it.off - it.spec.thick : COLLAR_R + 8 + it.off)
        return (
          <g key={side}>
            {live ? (
              <AnimatePresence initial={false}>
                {items.map((it) => (
                  <motion.g
                    key={it.id}
                    initial={{ x: at(it) + side * 260, opacity: 0 }}
                    animate={{ x: at(it), opacity: 1 }}
                    exit={{ x: at(it) + side * 260, opacity: 0, transition: spring.slow.exit }}
                    transition={{ ...spring.slow, bounce: 0.28 }}
                  >
                    <Plate spec={it.spec} />
                  </motion.g>
                ))}
              </AnimatePresence>
            ) : (
              items.map((it, i) => (
                <g key={it.id} data-plate data-side={side} data-index={i} transform={`translate(${at(it)} 0)`}>
                  <Plate spec={it.spec} />
                </g>
              ))
            )}
          </g>
        )
      })}
    </svg>
  )
}

function Plate({ spec }: { spec: (typeof PLATE_SPECS)[number] }) {
  return (
    <g>
      <rect x={0} y={CY - spec.h / 2} width={spec.thick} height={spec.h} rx={4} fill={spec.color} />
      <rect x={2} y={CY - spec.h / 2 + 6} width={2.5} height={spec.h - 12} rx={1} fill="#fff" opacity={0.18} />
      {spec.thick >= 15 && (
        <text
          x={spec.thick / 2}
          y={CY - spec.h / 2 + 22}
          textAnchor="middle"
          fontSize={11}
          fill={spec.ink}
          opacity={0.85}
          style={{ fontVariationSettings: "'wdth' 62, 'wght' 800" }}
        >
          {spec.label}
        </text>
      )}
    </g>
  )
}
