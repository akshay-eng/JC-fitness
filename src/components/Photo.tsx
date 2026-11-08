import { useEffect, useState, type CSSProperties } from 'react'
import { Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  /** Path inside public/, e.g. "images/gallery/floor.jpg". Drop a file there and it appears. */
  src?: string
  alt: string
  className?: string
  imgClassName?: string
  /** Short name for the placeholder ("Main floor"). */
  label?: string
  /** Recommended pixel size, shown on the placeholder. */
  size?: string
  /** Show the designed placeholder while the file is missing. Off: render nothing. */
  placeholder?: boolean
  /** Above-the-fold images load eagerly. */
  priority?: boolean
  style?: CSSProperties
  /** Extra attribute for scroll effects on the <img>. */
  parallax?: boolean
}

type Status = 'loading' | 'loaded' | 'missing'

/**
 * A real-photo slot. It tries the file; if it is not there yet, a placeholder
 * names the exact path and size to drop in, so adding photos needs no code.
 */
export function Photo({ src, alt, className, imgClassName, label, size = '1600 × 1200', placeholder = true, priority, style, parallax }: Props) {
  const [status, setStatus] = useState<Status>(src ? 'loading' : 'missing')

  useEffect(() => {
    setStatus(src ? 'loading' : 'missing')
  }, [src])

  if (!placeholder && status === 'missing') return null

  return (
    <div className={cn('relative overflow-clip', className)} style={style}>
      {placeholder && status !== 'loaded' && <Placeholder label={label ?? alt} src={src} size={size} pending={status === 'loading'} />}
      {src && status !== 'missing' && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          data-parallax={parallax || undefined}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('missing')}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-[var(--ease-out)]',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      )}
    </div>
  )
}

function Placeholder({ label, src, size, pending }: { label: string; src?: string; size: string; pending: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,rgb(244_241_234/0.035)_0_10px,transparent_10px_22px)] p-4 text-center',
        pending && 'animate-pulse',
      )}
    >
      {/* crop marks */}
      <span className="absolute top-3 left-3 size-4 border-t-2 border-l-2 border-fg/25" />
      <span className="absolute top-3 right-3 size-4 border-t-2 border-r-2 border-fg/25" />
      <span className="absolute bottom-3 left-3 size-4 border-b-2 border-l-2 border-fg/25" />
      <span className="absolute right-3 bottom-3 size-4 border-r-2 border-b-2 border-fg/25" />
      <div className="flex flex-col items-center gap-2">
        <span className="grid size-11 place-items-center rounded-full bg-fg/[0.06] text-fg/60">
          <Camera className="size-5" />
        </span>
        <span className="eyebrow text-fg/70">{label}</span>
        {src && <span className="max-w-full font-mono text-[11px] break-all text-fg/40">public/{src}</span>}
        <span className="text-[11px] text-fg/30">{size}</span>
      </div>
    </div>
  )
}
