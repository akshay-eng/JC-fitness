const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export const rupees = (n: number) => `₹${inr.format(n)}`
export const num = (n: number) => inr.format(n)

export const dayNum = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit' })
export const monthShort = (d: Date) => d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()
export const weekdayShort = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short' })
export const longDate = (d: Date) =>
  d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
