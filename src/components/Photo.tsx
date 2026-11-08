import { useEffect, useState, type CSSProperties } from 'react'
import { Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tone = 'natural' | 'cool' | 'duo'

type Props = {
  /** Path inside public/, e.g. "images/gallery/floor.jpg". Replace the file and the site updates. */
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
  /**
   * Colour grade that ties stock and real photos into one look.
   * cool: a light blue grade. duo: brand duotone that blooms into full colour
   * on hover (needs a `group` ancestor).
   */
  tone?: Tone
}

type Status = 'loading' | 'loaded' | 'missing'

/**
 * A photo slot. It tries the file; if it is not there yet, a placeholder
 * names the exact path and size to drop in, so swapping photos needs no code.
 */
export function Photo({ src, alt, className, imgClassName, label, size = '1600 × 1200', placeholder = true, priority, style, tone = 'natural' }: Props) {
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
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('missing')}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-[opacity,filter,scale] duration-700 ease-[var(--ease-out)]',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            tone === 'duo' && 'contrast-110 grayscale group-hover:grayscale-0',
            imgClassName,
          )}
        />
      )}
      {tone !== 'natural' && status === 'loaded' && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 transition-opacity duration-700 ease-[var(--ease-out)]',
            tone === 'duo'
              ? 'bg-[linear-gradient(140deg,var(--brand)_10%,var(--navy)_55%,var(--volt))] opacity-90 mix-blend-color group-hover:opacity-0'
              : 'bg-[linear-gradient(160deg,rgb(59_140_255/0.4),rgb(10_26_58/0.55)_70%)] mix-blend-soft-light',
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
        'absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,rgb(234_242_247/0.035)_0_10px,transparent_10px_22px)] p-4 text-center',
        pending && 'animate-pulse',
      )}
    >
      {!pending && (
        <div className="flex flex-col items-center gap-2">
          <span className="grid size-11 place-items-center rounded-full bg-fg/[0.06] text-fg/60">
            <Camera className="size-5" />
          </span>
          <span className="eyebrow text-fg/70">{label}</span>
          {src && <span className="max-w-full font-mono text-[11px] break-all text-fg/40">public/{src}</span>}
          <span className="text-[11px] text-fg/30">{size}</span>
        </div>
      )}
    </div>
  )
}
