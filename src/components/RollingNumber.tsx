import { motion } from 'motion/react'
import { spring } from '@/lib/springs'
import { cn } from '@/lib/utils'

const DIGITS = '0123456789'

/**
 * Odometer: each digit is a column of 0-9 that springs to its value, so a
 * price change reads as the number rolling, not swapping.
 */
export function RollingNumber({ value, className, prefix = '' }: { value: string; className?: string; prefix?: string }) {
  const chars = Array.from(prefix + value)
  return (
    <span className={cn('relative inline-flex overflow-clip tabular leading-none', className)} aria-label={prefix + value}>
      {chars.map((ch, i) => {
        const key = `${chars.length - i}`
        if (!DIGITS.includes(ch)) {
          return (
            <span key={key + ch} aria-hidden="true" className="inline-block">
              {ch}
            </span>
          )
        }
        const n = Number(ch)
        return (
          <span key={key} aria-hidden="true" className="relative inline-block h-[1em] w-[1ch] overflow-clip">
            <motion.span
              className="absolute inset-x-0 top-0 flex flex-col items-center"
              initial={false}
              animate={{ y: `${-n}em` }}
              transition={{ ...spring.slow, delay: (chars.length - i) * 0.025 }}
            >
              {DIGITS.split('').map((d) => (
                <span key={d} className="block h-[1em] leading-none">
                  {d}
                </span>
              ))}
            </motion.span>
          </span>
        )
      })}
    </span>
  )
}
