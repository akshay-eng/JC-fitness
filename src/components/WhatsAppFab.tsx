import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { gym } from '@/content'
import { spring } from '@/lib/springs'
import { waLink } from '@/lib/whatsapp'
import { WhatsAppIcon } from './icons'

/** Always-there WhatsApp: a pulsing button that opens its label on hover or focus. */
export function WhatsAppFab({ show }: { show: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <AnimatePresence>
      {show && (
        <motion.a
          key="fab"
          href={waLink(`Hi ${gym.name}! I have a question.`)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with a coach on WhatsApp"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, transition: spring.slow.exit }}
          transition={{ ...spring.slow, bounce: 0.4, delay: 0.6 }}
          whileTap={{ scale: 0.96 }}
          className="fixed right-[max(16px,env(safe-area-inset-right))] bottom-[max(16px,env(safe-area-inset-bottom))] z-[60] flex h-14 items-center rounded-full bg-wa pr-[18px] pl-[17px] text-[#06240f] shadow-[0_12px_40px_rgb(37_211_102/0.35)]"
        >
          <span className="pulse-ring absolute inset-0 rounded-full text-wa" aria-hidden="true" />
          <WhatsAppIcon size={24} className="relative" />
          <motion.span
            initial={false}
            animate={{ width: open ? 'auto' : 0, opacity: open ? 1 : 0, marginLeft: open ? 10 : 0 }}
            transition={open ? spring.moderate : spring.moderate.exit}
            className="relative overflow-clip whitespace-nowrap text-[14px] uppercase tracking-[0.06em] [font-variation-settings:'wght'_700]"
          >
            Chat with a coach
          </motion.span>
        </motion.a>
      )}
    </AnimatePresence>
  )
}
