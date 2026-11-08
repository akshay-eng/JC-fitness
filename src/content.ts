/**
 * Every piece of business content lives here: phone, WhatsApp, address, hours,
 * programs, plans, prices and events. Edit this file to make the site yours;
 * no component needs to change.
 *
 * PLACEHOLDERS: the phone/WhatsApp number, address, prices and event details
 * below are sample values. Replace them before going live.
 */

import type { StationId } from '@/components/lifter/stations'

export const gym = {
  name: 'JC Fitness',
  short: 'JC',
  tagline: 'Strength club',
  /** International format, digits only, no "+" (used for wa.me links). */
  whatsapp: '919999999999',
  phoneDisplay: '+91 99999 99999',
  email: 'hello@jcfitness.in',
  address: {
    line1: '2nd Floor, 14 Main Road',
    line2: 'HSR Layout, Bengaluru 560102',
    /** Used for the map embed and the "Get directions" link. */
    mapQuery: 'HSR Layout, Bengaluru',
  },
  hours: [
    { days: 'Mon – Sat', time: '5:00 AM – 11:00 PM' },
    { days: 'Sunday', time: '6:00 AM – 1:00 PM' },
  ],
  social: {
    instagram: 'https://instagram.com/',
    youtube: 'https://youtube.com/',
  },
  /**
   * Optional: a form endpoint (Formspree, Web3Forms, your own API) that
   * receives the contact form as JSON. Set VITE_FORM_ENDPOINT in .env to use
   * it. WhatsApp always works, with or without it.
   */
  formEndpoint: import.meta.env.VITE_FORM_ENDPOINT as string | undefined,
}

export const marqueeItems = [
  'First session free',
  'Open 5 AM to 11 PM',
  '4 Olympic platforms',
  'Coaches on the floor',
  'Boxing ring',
  'Recovery zone',
  'Women-only hours',
]

export type Program = {
  id: string
  title: string
  line: string
  schedule: string
  icon: 'barbell' | 'olympic' | 'hiit' | 'boxing' | 'yoga' | 'coach'
  /** Optional background photo (path inside public/). Shown only once the file exists. */
  image?: string
}

export const programs: Program[] = [
  {
    id: 'strength',
    image: 'images/programs/strength.jpg',
    title: 'Strength & Powerlifting',
    line: 'Squat, bench, deadlift. Programmed blocks, tracked numbers, and a coach who notices when your bar path drifts.',
    schedule: 'Daily · 6 AM & 7 PM',
    icon: 'barbell',
  },
  {
    id: 'olympic',
    image: 'images/programs/olympic.jpg',
    title: 'Olympic Lifting',
    line: 'Snatch and clean & jerk on real platforms with bumper plates you can drop.',
    schedule: 'Tue · Thu · Sat',
    icon: 'olympic',
  },
  {
    id: 'hiit',
    image: 'images/programs/hiit.jpg',
    title: 'HIIT Burn',
    line: '45 minutes, heart rate on the screen, music loud.',
    schedule: 'Daily · 7 AM & 6 PM',
    icon: 'hiit',
  },
  {
    id: 'boxing',
    image: 'images/programs/boxing.jpg',
    title: 'Boxing',
    line: 'Pads, bags and footwork in the ring. Sparring only when you ask for it.',
    schedule: 'Mon · Wed · Fri',
    icon: 'boxing',
  },
  {
    id: 'yoga',
    image: 'images/programs/yoga.jpg',
    title: 'Yoga & Mobility',
    line: 'Hips, shoulders and spine that keep up with your lifting.',
    schedule: 'Daily · 8 AM',
    icon: 'yoga',
  },
  {
    id: 'pt',
    image: 'images/programs/pt.jpg',
    title: 'Personal Training',
    line: 'One coach, one plan, built around your schedule and your goal.',
    schedule: 'By appointment',
    icon: 'coach',
  },
]

export type Billing = 'monthly' | 'quarterly' | 'yearly'

export const billingOptions: { id: Billing; label: string; note?: string; months: number }[] = [
  { id: 'monthly', label: 'Monthly', months: 1 },
  { id: 'quarterly', label: 'Quarterly', note: '−10%', months: 3 },
  { id: 'yearly', label: 'Yearly', note: '−25%', months: 12 },
]

export type Plan = {
  id: string
  name: string
  pitch: string
  /** Price per month for each billing period, in rupees. */
  perMonth: Record<Billing, number>
  features: string[]
  featured?: boolean
}

export const plans: Plan[] = [
  {
    id: 'base',
    name: 'Base',
    pitch: 'The full floor, whenever you want it.',
    perMonth: { monthly: 1999, quarterly: 1799, yearly: 1499 },
    features: [
      'Full strength floor & free weights',
      'Cardio zone',
      'Lockers & showers',
      'Fitness assessment on day one',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    pitch: 'Every class on the timetable, plus the platforms.',
    perMonth: { monthly: 2999, quarterly: 2699, yearly: 2249 },
    features: [
      'Everything in Base',
      'Unlimited group classes',
      'Olympic platform access',
      'Monthly progress check-in',
      '2 guest passes a month',
    ],
    featured: true,
  },
  {
    id: 'beast',
    name: 'Beast',
    pitch: 'A coach in your corner, every week.',
    perMonth: { monthly: 5999, quarterly: 5399, yearly: 4499 },
    features: [
      'Everything in Pro',
      '12 personal training sessions a month',
      'Custom nutrition plan',
      'Sauna & ice bath',
      'Priority entry to every event',
    ],
  },
]

export const pricingExtras = ['Day pass ₹399', 'Student pricing on request', 'Couples plan available']

/** Shown under the billing toggle. Confirm this matches your actual policy. */
export const pricingNote = 'No joining fee. Pause your plan for up to 30 days a year.'

/* ------------------------------------------------------------------------ */
/* Events. Dates are computed relative to today so the sample calendar never */
/* looks stale. For a live site, replace `date` with fixed dates, e.g.      */
/* new Date('2026-12-12T07:00:00').                                         */
/* ------------------------------------------------------------------------ */

export type EventKind = 'competition' | 'run' | 'workshop' | 'community'

export type GymEvent = {
  id: string
  title: string
  kind: EventKind
  date: Date
  time: string
  place: string
  blurb: string
  seats?: { total: number; taken: number }
  price: string
  featured?: boolean
  /** Photo shown when the row is hovered (path inside public/). */
  image?: string
}

function inDays(days: number, hour = 7, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d
}

function next(weekday: number, hour: number, minute = 0, skipWeeks = 0) {
  const d = new Date()
  const diff = (weekday - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + diff + skipWeeks * 7)
  d.setHours(hour, minute, 0, 0)
  return d
}

export const eventKinds: { id: EventKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'competition', label: 'Competitions' },
  { id: 'run', label: 'Run club' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'community', label: 'Community' },
]

export const events: GymEvent[] = [
  {
    id: 'iron-clash',
    title: 'JC Iron Clash',
    kind: 'competition',
    date: next(6, 7, 0, 3),
    time: '7:00 AM',
    place: 'Main floor',
    blurb: 'Our in-house powerlifting meet. Three attempts each at squat, bench and deadlift, real judges, real lights, every weight class.',
    seats: { total: 64, taken: 41 },
    price: '₹499 entry · free to watch',
    featured: true,
  },
  {
    id: 'sunrise-5k',
    title: 'Sunrise 5K',
    kind: 'run',
    date: next(0, 6, 0),
    time: '6:00 AM',
    place: 'Meet at JC entrance',
    blurb: 'Conversational pace, every Sunday. Coffee after.',
    price: 'Free',
  },
  {
    id: 'deadlift-clinic',
    image: 'images/events/deadlift-clinic.jpg',
    title: 'Deadlift Clinic',
    kind: 'workshop',
    date: next(6, 10, 0),
    time: '10:00 AM',
    place: 'Platform 2',
    blurb: '90 minutes on setup, bracing and lockout. Bring your current 5RM.',
    seats: { total: 12, taken: 10 },
    price: '₹299 · free on Beast',
  },
  {
    id: 'fight-night',
    image: 'images/events/fight-night.jpg',
    title: 'Fight Night',
    kind: 'community',
    date: next(5, 20, 0),
    time: '8:00 PM',
    place: 'Boxing ring',
    blurb: 'Members spar three controlled rounds. Everyone else brings the noise.',
    price: 'Free for members',
  },
  {
    id: 'hybrid-sim',
    image: 'images/events/hybrid-sim.jpg',
    title: 'Hybrid Race Sim',
    kind: 'competition',
    date: next(6, 7, 30, 1),
    time: '7:30 AM',
    place: 'Turf & main floor',
    blurb: '8 × 1 km runs between sled, row, wall balls and lunges. Solo or pairs.',
    seats: { total: 40, taken: 22 },
    price: '₹399',
  },
  {
    id: 'women-strength',
    image: 'images/events/women-strength.jpg',
    title: "Women's Strength Bootcamp",
    kind: 'workshop',
    date: next(1, 19, 0),
    time: '7:00 PM',
    place: 'Studio B',
    blurb: 'Six weeks, small batch, built around the three big lifts.',
    seats: { total: 16, taken: 9 },
    price: '₹2,499 for 6 weeks',
  },
  {
    id: 'mobility-sunday',
    image: 'images/events/mobility-sunday.jpg',
    title: 'Mobility & Recovery Sunday',
    kind: 'workshop',
    date: next(0, 9, 0, 1),
    time: '9:00 AM',
    place: 'Studio A + sauna',
    blurb: 'Long-hold mobility, breathwork, then the sauna.',
    price: 'Free for members',
  },
  {
    id: 'pancake-social',
    image: 'images/events/pancake-social.jpg',
    title: 'Protein Pancake Social',
    kind: 'community',
    date: inDays(17, 11, 0),
    time: '11:00 AM',
    place: 'JC lounge',
    blurb: 'Meet the coaches, swap programs, eat pancakes.',
    price: 'Free',
  },
]

/** Lift Lab titles, by successful clean & jerk weight (kg). */
export const liftTitles: { min: number; title: string }[] = [
  { min: 220, title: "Gravity's Problem" },
  { min: 180, title: 'Bar Bender' },
  { min: 140, title: 'Plate Crusher' },
  { min: 100, title: 'Barbell Regular' },
  { min: 60, title: 'Plate Starter' },
  { min: 0, title: 'Warm-up Hero' },
]

/* ------------------------------------------------------------------------ */
/* Photos. Every path is inside public/. Drop a file with that name in and  */
/* it appears; until then a placeholder shows the path and size to use.     */
/* See public/images/README.md for the full list.                           */
/* ------------------------------------------------------------------------ */

export const images = {
  /** The hero's main photo, in the angled panel. Landscape, 2000 × 1400 or larger. */
  hero: 'images/hero.jpg',
  /** Close-up in the round inset over the hero photo. Square, 800 × 800. */
  heroDetail: 'images/hero-detail.jpg',
  /** Inside the featured event card, tinted orange. 1600 × 1000. */
  featuredEvent: 'images/events/iron-clash.jpg',
}

export type Station = {
  id: StationId
  name: string
  short: string
  kind: 'strength' | 'cardio'
  line: string
  works: string[]
  /** How many you have. Placeholder numbers: edit to match your floor. */
  count: string
  image: string
  /** Weight shown in the hero showreel. */
  demoKg?: number
}

export const stations: Station[] = [
  {
    id: 'clean',
    name: 'Clean & jerk',
    short: 'Clean & jerk',
    kind: 'strength',
    line: 'Floor to overhead in two moves, taught on real platforms with bumpers you can drop.',
    works: ['Full body', 'Power', 'Speed'],
    count: '4 Olympic platforms',
    image: 'images/stations/clean.jpg',
    demoKg: 120,
  },
  {
    id: 'squat',
    name: 'Back squat',
    short: 'Squat',
    kind: 'strength',
    line: 'The king of leg day. Every rack has safeties set, so you can chase the last rep.',
    works: ['Quads', 'Glutes', 'Core'],
    count: '6 power racks',
    image: 'images/stations/squat.jpg',
    demoKg: 180,
  },
  {
    id: 'bench',
    name: 'Bench press',
    short: 'Bench',
    kind: 'strength',
    line: 'Flat, incline and decline benches, and a coach to spot you when you ask.',
    works: ['Chest', 'Shoulders', 'Triceps'],
    count: '8 benches',
    image: 'images/stations/bench.jpg',
    demoKg: 120,
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    short: 'Deadlift',
    kind: 'strength',
    line: 'Pick it up, put it down. Dedicated platforms and calibrated plates.',
    works: ['Back', 'Hamstrings', 'Grip'],
    count: '4 deadlift platforms',
    image: 'images/stations/deadlift.jpg',
    demoKg: 220,
  },
  {
    id: 'treadmill',
    name: 'Treadmill',
    short: 'Treadmill',
    kind: 'cardio',
    line: 'Run, walk or hike on an incline, with your heart rate on the console.',
    works: ['Heart', 'Lungs', 'Legs'],
    count: '12 treadmills',
    image: 'images/stations/treadmill.jpg',
  },
  {
    id: 'elliptical',
    name: 'Elliptical (Orbitrek)',
    short: 'Elliptical',
    kind: 'cardio',
    line: 'Low impact, full body. Easy on the knees, hard on the lungs.',
    works: ['Legs', 'Arms', 'Heart'],
    count: '6 ellipticals',
    image: 'images/stations/elliptical.jpg',
  },
  {
    id: 'bike',
    name: 'Spin bike',
    short: 'Spin bike',
    kind: 'cardio',
    line: 'Ride solo, or join a spin class with the lights down and the music up.',
    works: ['Quads', 'Calves', 'Heart'],
    count: '20-bike spin studio',
    image: 'images/stations/bike.jpg',
  },
  {
    id: 'rower',
    name: 'Rower',
    short: 'Rower',
    kind: 'cardio',
    line: 'Legs drive, body swings, arms finish. A full-body stroke every two seconds.',
    works: ['Back', 'Legs', 'Heart'],
    count: '6 air rowers',
    image: 'images/stations/rower.jpg',
  },
]

export type GalleryPhoto = { src: string; label: string; alt: string; size: string }

export const gallery: GalleryPhoto[] = [
  { src: 'images/gallery/floor.jpg', label: 'Rack row', alt: 'Power racks and coloured bumper plates on the strength floor', size: '1600 × 1200' },
  { src: 'images/gallery/boxing.jpg', label: 'Bag work', alt: 'A boxer kicking a heavy bag', size: '1600 × 900' },
  { src: 'images/gallery/cardio.jpg', label: 'Cardio by the window', alt: 'Treadmills facing a window full of plants', size: '1200 × 1600' },
  { src: 'images/gallery/weights.jpg', label: 'Free weights', alt: 'A rack of hex dumbbells', size: '1600 × 1066' },
  { src: 'images/gallery/class.jpg', label: 'Spin night', alt: 'Members laughing during a spin class', size: '1600 × 1066' },
  { src: 'images/gallery/platforms.jpg', label: 'Platforms', alt: 'Loaded barbells on the lifting platforms', size: '1600 × 1066' },
  { src: 'images/gallery/recovery.jpg', label: 'Sauna', alt: 'The wooden sauna in the recovery zone', size: '1600 × 1066' },
  { src: 'images/gallery/ropes.jpg', label: 'Conditioning', alt: 'An athlete working battle ropes', size: '1600 × 1066' },
  { src: 'images/gallery/cardio-deck.jpg', label: 'Cardio deck', alt: 'Air bikes and cross trainers on the cardio deck', size: '1200 × 1600' },
  { src: 'images/gallery/kettlebells.jpg', label: 'Kettlebells', alt: 'Kettlebells and dumbbells on rubber flooring', size: '1600 × 1066' },
]
