import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { KineticHeading } from '@/components/KineticHeading'
import { MagneticButton } from '@/components/MagneticButton'
import { WhatsAppIcon } from '@/components/icons'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { gym, plans, programs } from '@/content'
import { useBooking } from '@/lib/booking'
import { spring } from '@/lib/springs'
import { waLink } from '@/lib/whatsapp'

const TIMES = ['Early morning (5–8 AM)', 'Morning (8 AM–12 PM)', 'Afternoon (12–5 PM)', 'Evening (5–9 PM)', 'Late (9–11 PM)']
const GOALS = ['Get stronger', 'Build muscle', 'Lose fat', 'Get fit for a sport', 'Compete', 'Just stay healthy']
const BASE_INTERESTS = [...programs.map((p) => p.title), ...plans.map((p) => `${p.name} plan`), 'Not sure yet']

type Form = { name: string; phone: string; interest: string; goal: string; time: string; message: string }
type Errors = Partial<Record<keyof Form, string>>

const empty: Form = { name: '', phone: '', interest: '', goal: '', time: '', message: '' }

function validate(f: Form): Errors {
  const e: Errors = {}
  if (f.name.trim().length < 2) e.name = 'Tell us your name so the coach knows who to expect.'
  const digits = f.phone.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 13) e.phone = 'Enter a 10-digit mobile number (country code optional).'
  return e
}

function compose(f: Form) {
  const lines = [
    `Hi ${gym.name}! I'd like to book my free first session.`,
    '',
    `Name: ${f.name.trim()}`,
    `Phone: ${f.phone.trim()}`,
    f.interest && `Interested in: ${f.interest}`,
    f.goal && `Goal: ${f.goal}`,
    f.time && `Best time: ${f.time}`,
    f.message.trim() && `Note: ${f.message.trim()}`,
  ]
  return lines.filter((l): l is string => typeof l === 'string').join('\n')
}

export function Contact() {
  const { prefill } = useBooking()
  const [form, setForm] = useState<Form>(empty)
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const shake = useAnimationControls()

  const interests = prefill.interest && !BASE_INTERESTS.includes(prefill.interest) ? [prefill.interest, ...BASE_INTERESTS] : BASE_INTERESTS

  useEffect(() => {
    if (!prefill.nonce) return
    setSent(null)
    setForm((f) => ({ ...f, interest: prefill.interest ?? f.interest }))
    // Wait for the smooth scroll to land before moving focus.
    const t = window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 1100)
    return () => window.clearTimeout(t)
  }, [prefill])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) {
      shake.start({ x: [0, -12, 10, -6, 4, 0], transition: { duration: 0.36, ease: 'easeInOut' } })
      const first = document.getElementById(`cf-${Object.keys(found)[0]}`)
      first?.focus()
      return
    }
    const message = compose(form)
    const link = waLink(message)
    // Open synchronously, inside the click, so popup blockers allow it.
    window.open(link, '_blank', 'noopener,noreferrer')
    if (gym.formEndpoint) {
      fetch(gym.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, source: 'jc-fitness-site' }),
      }).catch(() => {
        /* WhatsApp already carries the lead; the backup post failing is not fatal */
      })
    }
    setSent(link)
    setForm(empty)
  }

  return (
    <section id="contact" aria-labelledby="contact-title" className="section">
      <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="flex flex-col">
          <p className="eyebrow mb-5 text-brand">Contact</p>
          <KineticHeading id="contact-title" lines={['Your first', 'session is', { text: 'on us.', className: 'text-brand' }]} className="text-[clamp(52px,8.5vw,112px)]" />
          <p className="mt-6 max-w-md text-fg/75">
            Tell us a little about you and we&apos;ll reply on WhatsApp with a slot. Usually within the hour during opening times.
          </p>

          <ul className="mt-10 grid gap-5 text-[15px]">
            <li className="flex gap-4">
              <MapPin className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <p>{gym.address.line1}</p>
                <p className="text-fg/70">{gym.address.line2}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.address.mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex min-h-11 items-center gap-1 text-[13px] uppercase tracking-[0.08em] text-brand"
                >
                  Get directions <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <Clock className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
                {gym.hours.map((h) => (
                  <div key={h.days} className="contents">
                    <dt className="text-fg/70">{h.days}</dt>
                    <dd>{h.time}</dd>
                  </div>
                ))}
              </dl>
            </li>
            <li className="flex items-center gap-4">
              <Phone className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <a href={`tel:+${gym.whatsapp}`} className="min-h-11 content-center hover:text-brand">
                {gym.phoneDisplay}
              </a>
            </li>
            <li className="flex items-center gap-4">
              <Mail className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <a href={`mailto:${gym.email}`} className="min-h-11 content-center hover:text-brand">
                {gym.email}
              </a>
            </li>
          </ul>

          <div className="mt-10 overflow-clip rounded-[22px] shadow-[inset_0_0_0_1px_rgb(244_241_234/0.08)]">
            <iframe
              title={`Map showing ${gym.name}`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(gym.address.mapQuery)}&z=14&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[240px] w-full border-0 [filter:grayscale(1)_invert(0.92)_contrast(0.9)_brightness(0.95)]"
            />
          </div>
        </div>

        <motion.div animate={shake} className="relative">
          <div className="relative overflow-clip rounded-[28px] bg-card p-6 shadow-[inset_0_0_0_1px_rgb(244_241_234/0.08)] sm:p-10">
            <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(circle,rgb(37_211_102/0.14),transparent_65%)]" />
            <AnimatePresence mode="wait" initial={false}>
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, transition: spring.slow.exit }}
                  transition={spring.slow}
                  className="flex min-h-[520px] flex-col items-center justify-center text-center"
                  role="status"
                >
                  <svg viewBox="0 0 80 80" className="size-24" aria-hidden="true">
                    <motion.circle cx="40" cy="40" r="36" fill="none" stroke="var(--wa)" strokeWidth="5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }} />
                    <motion.path d="M24 41l11 11 21-24" fill="none" stroke="var(--wa)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.35, ease: [0.23, 1, 0.32, 1] }} />
                  </svg>
                  <h3 className="display mt-6 text-5xl" style={{ ['--wd' as string]: 68 }}>
                    Nearly there
                  </h3>
                  <p className="mt-3 max-w-sm text-fg/75">WhatsApp has opened with your message ready. Hit send and we&apos;ll lock in your free session.</p>
                  <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                    <MagneticButton href={sent} external variant="wa">
                      <WhatsAppIcon size={18} />
                      Didn&apos;t open? Tap here
                    </MagneticButton>
                    <button type="button" onClick={() => setSent(null)} className="min-h-11 px-4 text-[13px] uppercase tracking-[0.08em] text-fg/60 hover:text-fg">
                      Send another
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  noValidate
                  onSubmit={submit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: spring.slow.exit }}
                  transition={spring.slow}
                  className="relative grid gap-5"
                  aria-labelledby="form-title"
                >
                  <div>
                    <h3 id="form-title" className="display text-4xl sm:text-5xl" style={{ ['--wd' as string]: 68 }}>
                      Book a free session
                    </h3>
                    <p className="mt-2 text-[15px] text-fg/65">Two fields required. The rest helps your coach plan.</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field data-invalid={!!errors.name || undefined}>
                      <FieldLabel htmlFor="cf-name">Your name *</FieldLabel>
                      <Input ref={nameRef} id="cf-name" name="name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name || undefined} placeholder="Aarav Sharma" />
                      {errors.name && <FieldError>{errors.name}</FieldError>}
                    </Field>
                    <Field data-invalid={!!errors.phone || undefined}>
                      <FieldLabel htmlFor="cf-phone">Mobile number *</FieldLabel>
                      <Input id="cf-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={!!errors.phone || undefined} placeholder="98765 43210" />
                      {errors.phone && <FieldError>{errors.phone}</FieldError>}
                    </Field>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="cf-interest">Interested in</FieldLabel>
                      <Select value={form.interest} onValueChange={(v) => set('interest', v)} name="interest">
                        <SelectTrigger id="cf-interest" placeholder="Pick a program or plan" />
                        <SelectContent>
                          {interests.map((o, i) => (
                            <SelectItem key={o} index={i} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="cf-goal">Main goal</FieldLabel>
                      <Select value={form.goal} onValueChange={(v) => set('goal', v)} name="goal">
                        <SelectTrigger id="cf-goal" placeholder="What are you here for?" />
                        <SelectContent>
                          {GOALS.map((o, i) => (
                            <SelectItem key={o} index={i} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="cf-time">Best time to train</FieldLabel>
                    <Select value={form.time} onValueChange={(v) => set('time', v)} name="time">
                      <SelectTrigger id="cf-time" placeholder="Choose a time window" />
                      <SelectContent>
                        {TIMES.map((o, i) => (
                          <SelectItem key={o} index={i} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="cf-message">Anything we should know?</FieldLabel>
                    <Textarea id="cf-message" name="message" rows={3} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Injuries, experience, a lift you want to learn…" />
                  </Field>

                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <MagneticButton type="submit" variant="wa" strength={0.15} className="w-full sm:w-auto">
                      <WhatsAppIcon size={18} />
                      Send on WhatsApp
                    </MagneticButton>
                    <p className="text-[13px] text-fg/55">Opens WhatsApp with your details filled in.</p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
