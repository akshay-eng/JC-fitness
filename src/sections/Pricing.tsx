import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { ArrowUpRight, Check } from 'lucide-react'
import { KineticHeading } from '@/components/KineticHeading'
import { MagneticButton } from '@/components/MagneticButton'
import { RollingNumber } from '@/components/RollingNumber'
import { WhatsAppIcon } from '@/components/icons'
import { Tabs, TabsItem } from '@/components/ui/tabs'
import { billingOptions, gym, plans, pricingExtras, pricingNote, type Billing, type Plan } from '@/content'
import { useBooking } from '@/lib/booking'
import { num, rupees } from '@/lib/format'
import { spring } from '@/lib/springs'
import { cn } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'

export function Pricing() {
  const [tab, setTab] = useState(0)
  const billing = billingOptions[tab]

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="section">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto h-[60vmax] max-w-5xl rounded-full bg-[radial-gradient(circle,rgb(255_91_20/0.12),transparent_60%)]" />
      <div className="container-x relative">
        <div className="mb-12 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow mb-5 text-brand">Membership</p>
            <KineticHeading id="pricing-title" lines={['Pick your', { text: 'weight class.', className: 'text-brand' }]} className="text-[clamp(52px,9.5vw,124px)]" />
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <Tabs selectedIndex={tab} onSelect={setTab} idPrefix="pricing" aria-label="Billing period">
              {billingOptions.map((b, i) => (
                <TabsItem key={b.id} index={i} label={b.note ? `${b.label} ${b.note}` : b.label} />
              ))}
            </Tabs>
            <p className="text-[13px] text-muted-foreground">{pricingNote}</p>
          </div>
        </div>

        {/* One persistent panel whose id follows the selected tab: the cards never remount, so prices roll. */}
        <div id={`pricing-panel-${tab}`} role="tabpanel" aria-labelledby={`pricing-tab-${tab}`} className="grid items-stretch gap-3 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} billing={billing.id} months={billing.months} />
          ))}
        </div>

        <ul className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Other options">
          {pricingExtras.map((x) => (
            <li key={x} className="rounded-full bg-fg/[0.05] px-4 py-2 text-[13px] text-fg/75 shadow-[inset_0_0_0_1px_rgb(244_241_234/0.06)]">
              {x}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function PlanCard({ plan, billing, months }: { plan: Plan; billing: Billing; months: number }) {
  const { book } = useBooking()
  const price = plan.perMonth[billing]
  const saving = (plan.perMonth.monthly - price) * 12
  const perDay = Math.round(price / 30)
  const label = billing === 'monthly' ? 'month' : billing === 'quarterly' ? 'quarter' : 'year'
  const message = `Hi ${gym.name}! I'd like to join the ${plan.name} plan, billed per ${label} (${rupees(price * months)}). When can I start?`

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={spring.slow}
      className={cn(
        'relative flex flex-col rounded-[28px] p-6 sm:p-8',
        plan.featured ? 'hot-border bg-[#17120f] lg:-my-4 lg:py-12' : 'bg-card shadow-[inset_0_0_0_1px_rgb(244_241_234/0.07)]',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="display display-italic text-[44px]" style={{ ['--wd' as string]: 66 }}>
          {plan.name}
        </h3>
        {plan.featured && <span className="rounded-full bg-volt px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-bg [font-variation-settings:'wght'_700]">Best value</span>}
      </div>
      <p className="mt-2 text-fg/70">{plan.pitch}</p>

      <div className="mt-8 flex items-end gap-2">
        <span className="display text-[40px] leading-none text-fg/60" style={{ ['--wd' as string]: 62 }}>
          ₹
        </span>
        <RollingNumber value={num(price)} className="display text-[clamp(72px,8vw,96px)]" />
        <span className="mb-2 text-fg/60">/mo</span>
      </div>
      <div className="mt-3 min-h-[44px] text-[14px] text-fg/65">
        <p>
          {billing === 'monthly' ? 'Billed monthly' : `Billed ${rupees(price * months)} every ${months === 3 ? '3 months' : 'year'}`} · about {rupees(perDay)} a day
        </p>
        <AnimatePresence initial={false}>
          {saving > 0 && (
            <motion.p
              key={billing}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: spring.moderate.exit }}
              transition={spring.moderate}
              className="text-volt"
            >
              You save {rupees(saving)} a year
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-fg/10 pt-6">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-[15px] text-fg/85">
            <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full', plan.featured ? 'bg-brand text-bg' : 'bg-fg/10 text-fg')}>
              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
            </span>
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-2">
        <MagneticButton href={waLink(message)} external variant={plan.featured ? 'brand' : 'outline'} strength={0.18} className="w-full">
          <WhatsAppIcon size={18} />
          Join {plan.name}
        </MagneticButton>
        <button
          type="button"
          onClick={() => book({ interest: `${plan.name} plan` })}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 text-[13px] uppercase tracking-[0.08em] text-fg/60 hover:text-fg"
        >
          Ask a question first
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  )
}
