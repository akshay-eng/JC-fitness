import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { scrollToId } from './scroll'

export type Prefill = { interest?: string; note?: string; nonce: number }

type Booking = {
  prefill: Prefill
  /** Scroll to the contact form with these fields filled in. */
  book: (p: Omit<Prefill, 'nonce'>) => void
}

const BookingContext = createContext<Booking | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [prefill, setPrefill] = useState<Prefill>({ nonce: 0 })
  const book = useCallback((p: Omit<Prefill, 'nonce'>) => {
    setPrefill((prev) => ({ ...p, nonce: prev.nonce + 1 }))
    scrollToId('contact')
  }, [])
  const value = useMemo(() => ({ prefill, book }), [prefill, book])
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider')
  return ctx
}
