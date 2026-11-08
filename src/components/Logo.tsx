import { gym } from '@/content'
import { cn } from '@/lib/utils'

/** Plate mark + wordmark. The mark is a bumper plate with the initials as the hub. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 40 40" className="size-9 shrink-0" aria-hidden="true">
        <circle cx="20" cy="20" r="16.5" fill="none" stroke="var(--brand)" strokeWidth="7" />
        <text
          x="20"
          y="24.6"
          textAnchor="middle"
          fontSize="13"
          fill="var(--fg)"
          style={{ fontVariationSettings: "'wdth' 62, 'wght' 900", fontStyle: 'italic' }}
        >
          {gym.short}
        </text>
      </svg>
      {!compact && (
        <span className="display display-italic text-[22px] leading-none" style={{ ['--wd' as string]: 72, ['--wg' as string]: 900 }}>
          {gym.short}
          <span className="text-brand">/</span>
          Fitness
        </span>
      )}
    </span>
  )
}
