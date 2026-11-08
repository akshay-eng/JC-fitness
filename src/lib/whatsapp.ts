import { gym } from '@/content'

/** A wa.me link that opens WhatsApp (app or web) with the message typed in. */
export function waLink(message: string) {
  return `https://wa.me/${gym.whatsapp}?text=${encodeURIComponent(message)}`
}

export function openWhatsApp(message: string) {
  window.open(waLink(message), '_blank', 'noopener,noreferrer')
}
