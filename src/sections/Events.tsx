import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { FluidHoverHighlight } from '@/components/fluid-hover-highlight'
import { KineticHeading } from '@/components/KineticHeading'
import { MagneticButton } from '@/components/MagneticButton'
import { Photo } from '@/components/Photo'
import { RollingNumber } from '@/components/RollingNumber'
import { WhatsAppIcon } from '@/components/icons'
import { Tabs, TabsItem, TabsPanel } from '@/components/ui/tabs'
import { eventKinds, events, gym, images, type GymEvent } from '@/content'
import { useFluidHover, useRegisterFluidHoverItem } from '@/hooks/use-fluid-hover'
import { dayNum, longDate, monthShort, weekdayShort } from '@/lib/format'
import { spring } from '@/lib/springs'
import { cn } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'

const KIND_LABEL: Record<GymEvent['kind'], string> = {
  competition: 'Competition',
  run: 'Run club',
  workshop: 'Workshop',
  community: 'Community',
}

const rsvp = (e: GymEvent) =>
  waLink(`Hi ${gym.name}! I'd like to RSVP for ${e.title} on ${longDate(e.date)} at ${e.time}. My name is `)

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const ms = Math.max(0, target.getTime() - now)
  const s = Math.floor(ms / 1000)
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
}

const soon = (d: Date) => d.getTime() - Date.now() < 1000 * 60 * 60 * 72

export function Events() {
  const [tab, setTab] = useState(0)
  const sorted = useMemo(() => [...events].sort((a, b) => a.date.getTime() - b.date.getTime()), [])
  const featured = sorted.find((e) => e.featured)

  return (
    <section id="events" aria-labelledby="events-title" className="section">
      <div className="container-x">
        <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow mb-5 text-brand">Events &amp; clubs</p>
            <KineticHeading id="events-title" lines={['Something on', { text: 'every week.', className: 'text-outline-fg' }]} className="text-[clamp(52px,9.5vw,124px)]" />
          </div>
          <p className="max-w-sm text-fg/70 lg:pb-3">
            Meets, run club, clinics and socials. Members get in free or first, and anyone can come and watch.
          </p>
        </div>

        {featured && <Featured event={featured} />}

        <div className="mt-14 flex flex-col gap-6">
          <div className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)] [scrollbar-width:none]">
            <Tabs selectedIndex={tab} onSelect={setTab} idPrefix="events" aria-label="Filter events" className="w-max">
              {eventKinds.map((k, i) => (
                <TabsItem key={k.id} index={i} label={k.label} />
              ))}
            </Tabs>
          </div>

          {eventKinds.map((k, i) => {
            const list = sorted.filter((e) => !e.featured && (k.id === 'all' || e.kind === k.id))
            return (
              <TabsPanel key={k.id} index={i} selectedIndex={tab} idPrefix="events">
                <EventList list={list} />
              </TabsPanel>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Featured({ event }: { event: GymEvent }) {
  const c = useCountdown(event.date)
  const left = event.seats ? event.seats.total - event.seats.taken : null
  const pct = event.seats ? (event.seats.taken / event.seats.total) * 100 : 0
  return (
    <article className="relative overflow-clip rounded-[28px] bg-brand text-bg">
      {/* Optional photo: public/images/events/iron-clash.jpg, multiplied into the orange. */}
      <Photo
        src={images.featuredEvent}
        alt=""
        placeholder={false}
        className="pointer-events-none absolute inset-0"
        imgClassName="opacity-45 mix-blend-multiply grayscale contrast-125"
      />
      <span
        aria-hidden="true"
        className="display display-italic pointer-events-none absolute -right-6 -bottom-10 text-[clamp(120px,22vw,300px)] leading-none text-bg/10 select-none"
        style={{ ['--wd' as string]: 62 }}
      >
        Iron
      </span>
      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="live-dot size-2 rounded-full bg-bg" aria-hidden="true" />
            Featured · {KIND_LABEL[event.kind]} · registrations open
          </p>
          <h3 className="display display-italic mt-5 text-[clamp(56px,9vw,120px)]" style={{ ['--wd' as string]: 62 }}>
            {event.title}
          </h3>
          <p className="mt-4 max-w-lg text-[17px] text-bg/80">{event.blurb}</p>
          <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[15px] [font-variation-settings:'wght'_600]">
            <span>
              {longDate(event.date)} · {event.time}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              {event.place}
            </span>
            <span>{event.price}</span>
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div role="timer" aria-label={`Starts in ${c.d} days, ${c.h} hours`} className="grid grid-cols-4 gap-2">
            {(
              [
                ['Days', c.d],
                ['Hrs', c.h],
                ['Min', c.m],
                ['Sec', c.s],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="rounded-2xl bg-bg/[0.08] px-2 py-3 text-center">
                <RollingNumber value={String(v).padStart(2, '0')} className="display text-[clamp(40px,5vw,64px)]" />
                <p className="eyebrow mt-2 text-[10px] text-bg/70">{label}</p>
              </div>
            ))}
          </div>
          {event.seats && (
            <div>
              <div className="mb-2 flex justify-between text-[13px] [font-variation-settings:'wght'_600]">
                <span>{left} spots left</span>
                <span>
                  {event.seats.taken}/{event.seats.total} lifters in
                </span>
              </div>
              <div className="h-2.5 overflow-clip rounded-full bg-bg/15" aria-hidden="true">
                <motion.div
                  className="h-full origin-left rounded-full bg-bg"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: pct / 100 }}
                  viewport={{ once: true }}
                  transition={{ ...spring.slow, delay: 0.2 }}
                />
              </div>
            </div>
          )}
          <MagneticButton href={rsvp(event)} external variant="outline" className="bg-bg text-fg shadow-none hover:bg-bg/90 hover:shadow-none">
            <WhatsAppIcon size={18} />
            Register on WhatsApp
          </MagneticButton>
        </div>
      </div>
    </article>
  )
}

function EventList({ list }: { list: GymEvent[] }) {
  const ref = useRef<HTMLUListElement>(null)
  const hover = useFluidHover(ref, { axis: 'y' })
  if (!list.length) {
    return <p className="py-12 text-center text-fg/60">Nothing in this category right now. Check back next week.</p>
  }
  return (
    <ul ref={ref} {...hover.handlers} className="relative border-t border-fg/10">
      <FluidHoverHighlight hover={hover} className="rounded-2xl" />
      {list.map((e, i) => (
        <EventRow key={e.id} event={e} index={i} register={hover.registerItem} />
      ))}
    </ul>
  )
}

function EventRow({ event, index, register }: { event: GymEvent; index: number; register: (i: number, el: HTMLElement | null) => void }) {
  const ref = useRef<HTMLLIElement>(null)
  useRegisterFluidHoverItem(register, index, ref as RefObject<HTMLElement | null>)
  const left = event.seats ? event.seats.total - event.seats.taken : null
  const almostFull = event.seats ? left! / event.seats.total <= 0.25 : false

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.moderate, delay: Math.min(index, 4) * 0.04 }}
      className="relative border-b border-fg/10"
    >
      <a
        href={rsvp(event)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`RSVP on WhatsApp for ${event.title}, ${longDate(event.date)} at ${event.time}`}
        className="group relative grid grid-cols-[64px_1fr_auto] items-center gap-x-4 gap-y-2 px-2 py-5 sm:grid-cols-[88px_1.4fr_1fr_auto] sm:gap-x-6 sm:px-4 lg:grid-cols-[96px_1.5fr_1fr_160px_auto]"
      >
        <div className="text-center">
          <p className="display text-[44px] leading-none sm:text-[56px]" style={{ ['--wd' as string]: 62 }}>
            {dayNum(event.date)}
          </p>
          <p className="eyebrow mt-1 text-[11px] text-brand">
            {monthShort(event.date)} · {weekdayShort(event.date)}
          </p>
        </div>

        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-fg/[0.07] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-fg/80">{KIND_LABEL[event.kind]}</span>
            {soon(event.date) && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-volt/15 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-volt">
                <span className="live-dot size-1.5 rounded-full bg-volt" aria-hidden="true" />
                This week
              </span>
            )}
            {almostFull && <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-brand">Almost full</span>}
          </div>
          <h3 className="display text-[28px] sm:text-[34px]" style={{ ['--wd' as string]: 72 }}>
            {event.title}
          </h3>
          <p className="mt-1 hidden text-[14px] text-fg/60 sm:block">{event.blurb}</p>
        </div>

        <div className="col-span-3 col-start-2 text-[14px] text-fg/75 sm:col-span-1 sm:col-start-auto">
          <p>{event.time}</p>
          <p className="text-fg/55">{event.place}</p>
          <p className="mt-1 text-fg/90 lg:hidden">{event.price}</p>
        </div>

        <div className="hidden lg:block">
          {event.seats ? (
            <>
              <p className="text-[13px] text-fg/70">{left} of {event.seats.total} left</p>
              <div className="mt-2 h-1.5 overflow-clip rounded-full bg-fg/10" aria-hidden="true">
                <div className={cn('h-full rounded-full', almostFull ? 'bg-brand' : 'bg-fg/70')} style={{ width: `${(event.seats.taken / event.seats.total) * 100}%` }} />
              </div>
            </>
          ) : (
            <p className="text-[13px] text-fg/70">Open to all</p>
          )}
          <p className="mt-2 text-[13px] text-fg/90">{event.price}</p>
        </div>

        <span
          className="col-start-3 row-start-1 grid size-11 place-items-center rounded-full bg-fg/[0.06] text-fg transition-[background-color,transform] duration-150 ease-[var(--ease-out)] group-hover:-rotate-45 group-hover:bg-brand group-hover:text-bg sm:col-start-auto sm:row-start-auto"
          aria-hidden="true"
        >
          <ArrowUpRight className="size-5 rotate-45" />
        </span>
      </a>
    </motion.li>
  )
}
