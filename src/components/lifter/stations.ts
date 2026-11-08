import { gsap } from '@/lib/gsap'
import type { LifterHandle, PropKind } from './Lifter'
import { ANKLE_Y, POSES, pose, shoulderOf, type Pose, type RigState } from './rig'
import { cleanAndJerk, vars } from './timelines'

export type StationId = 'clean' | 'squat' | 'bench' | 'deadlift' | 'treadmill' | 'elliptical' | 'bike' | 'rower'

type RepOptions = { onLockout?: () => void; onImpact?: () => void; effects?: boolean }

type StationRig = {
  prop: PropKind
  strength: boolean
  /** Where the athlete starts. */
  start: Pose
  /** A single readable frame, for reduced motion. */
  still: (s: RigState) => void
  /** One rep (strength) or an endless loop (cardio). */
  play: (h: LifterHandle, o?: RepOptions) => gsap.core.Animation
}

/* -------------------------------------------------------------------------- */
/* Strength poses                                                              */
/* -------------------------------------------------------------------------- */

/** Back squat: the bar sits on the traps, just behind the neck. */
const sq = (hx: number, hy: number, torso: number, head: number) => {
  const s = shoulderOf(hx, hy, torso)
  return pose({ hx, hy, torso, head, bx: s.x - 7, by: s.y - 5, eb: -1 })
}
const SQUAT = {
  stand: sq(200, 238, 8, -6),
  brace: sq(200, 241, 10, -10),
  mid: sq(184, 272, 26, -12),
  bottom: sq(168, 300, 38, -14),
  sticking: sq(178, 282, 34, -12),
}

/** Bench press: lying on the back, head left, feet planted to the right. */
const bn = (bx: number, by: number) => pose({ hx: 232, hy: 294, torso: -90, head: -27, bx, by, ffx: 284, bfx: 276 })
const BENCH = {
  rack: bn(138, 204),
  top: bn(150, 206),
  mid: bn(160, 240),
  chest: bn(166, 270),
}

const DEADLIFT = {
  setup: POSES.setup,
  wedge: POSES.wedge,
  floor: pose({ hx: 168, hy: 276, torso: 47, bx: 214, by: 306, head: -16 }),
  knee: POSES.knee,
  hips: pose({ hx: 186, hy: 246, torso: 22, bx: 210, by: 258, head: -6 }),
  lockout: pose({ hx: 198, hy: 238, torso: -4, bx: 203, by: 245, head: 0 }),
}

function rep(h: LifterHandle, build: (to: (p: Pose, d: number, ease: string, extra?: gsap.TweenVars) => void, tl: gsap.core.Timeline) => void) {
  const tl = gsap.timeline({ onUpdate: h.render })
  tl.set(h.state, { lights: 0, red: 0, free: 0, shake: 0, po: 1, two: 0 })
  build((p, d, ease, extra = {}) => tl.to(h.state, { ...vars(p), duration: d, ease, ...extra }), tl)
  return tl
}

const lights = (h: LifterHandle, tl: gsap.core.Timeline, o: RepOptions) => {
  tl.addLabel('lockout')
  tl.call(() => {
    if (o.effects !== false) h.burst()
    o.onLockout?.()
  })
  tl.to(h.state, { lights: 3, duration: 0.45, ease: 'steps(3)' })
}

function squatRep(h: LifterHandle, o: RepOptions = {}) {
  return rep(h, (to, tl) => {
    tl.addLabel('setup')
    tl.to({}, { duration: 0.5 })
    to(SQUAT.brace, 0.3, 'sine.inOut')
    tl.addLabel('down')
    to(SQUAT.mid, 0.6, 'power1.in')
    to(SQUAT.bottom, 0.5, 'power2.out')
    tl.to({}, { duration: 0.12 })
    tl.addLabel('drive')
    to(SQUAT.sticking, 0.45, 'power2.in')
    tl.fromTo(h.state, { shake: 1.8 }, { shake: 0, duration: 0.9, ease: 'power1.in' }, '<')
    to(SQUAT.stand, 0.5, 'power2.out')
    lights(h, tl, o)
    tl.to({}, { duration: 1 })
    tl.to(h.state, { lights: 0, duration: 0.2 })
  })
}

function benchRep(h: LifterHandle, o: RepOptions = {}) {
  return rep(h, (to, tl) => {
    tl.addLabel('unrack')
    tl.to({}, { duration: 0.4 })
    to(BENCH.top, 0.5, 'power2.inOut')
    tl.to({}, { duration: 0.3 })
    tl.addLabel('lower')
    to(BENCH.chest, 1.0, 'power1.inOut')
    tl.fromTo(h.state, { squash: 0.9 }, { squash: 1, duration: 0.3, ease: 'elastic.out(1, 0.4)' })
    tl.addLabel('press')
    to(BENCH.mid, 0.4, 'power2.in')
    tl.fromTo(h.state, { shake: 1.6 }, { shake: 0, duration: 0.8, ease: 'power1.in' }, '<')
    to(BENCH.top, 0.45, 'power2.out')
    lights(h, tl, o)
    tl.to({}, { duration: 0.8 })
    tl.addLabel('rack')
    to(BENCH.rack, 0.5, 'power2.inOut')
    tl.to(h.state, { lights: 0, duration: 0.2 }, '<')
    tl.to({}, { duration: 0.3 })
  })
}

function deadliftRep(h: LifterHandle, o: RepOptions = {}) {
  return rep(h, (to, tl) => {
    tl.addLabel('setup')
    tl.to({}, { duration: 0.4 })
    to(DEADLIFT.wedge, 0.4, 'sine.inOut')
    tl.addLabel('pull')
    to(DEADLIFT.floor, 0.7, 'power1.in')
    tl.fromTo(h.state, { shake: 2.4 }, { shake: 0.6, duration: 0.7 }, '<')
    to(DEADLIFT.knee, 0.35, 'none')
    to(DEADLIFT.hips, 0.3, 'none', { shake: 0 })
    to(DEADLIFT.lockout, 0.35, 'power2.out')
    lights(h, tl, o)
    tl.to({}, { duration: 0.8 })
    tl.addLabel('lower')
    tl.to(h.state, { lights: 0, duration: 0.2 })
    to(DEADLIFT.knee, 0.55, 'power1.inOut')
    to(DEADLIFT.setup, 0.35, 'power2.in')
    tl.call(() => {
      if (o.effects !== false) h.impact()
      o.onImpact?.()
    })
    tl.fromTo(h.state, { squash: 0.86 }, { squash: 1, duration: 0.35, ease: 'elastic.out(1, 0.4)' })
  })
}

/* -------------------------------------------------------------------------- */
/* Cardio: parametric gait cycles, t in [0, 1) per cycle                       */
/* -------------------------------------------------------------------------- */

const TAU = Math.PI * 2
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const cardioBase = { eb: 1, two: 1, po: 0, air: 0, ffl: 0, bfl: 0, free: 0, lights: 0, shake: 0 }

/** Belt travel per stride: a whole number of dash periods, so the loop is seamless. */
const BELT_PER_CYCLE = 136

function applyRun(s: RigState, t: number) {
  Object.assign(s, cardioBase)
  const phi = t * TAU
  s.torso = 12
  s.head = -14
  s.hx = 198
  s.hy = 242 - 3 * Math.cos(2 * phi)
  const foot = (ph: number) => {
    const swing = Math.sin(ph) < 0
    const up = swing ? -Math.sin(ph) : 0
    return { x: 200 + 34 * Math.cos(ph), air: 28 * up, lift: 14 * up }
  }
  const near = foot(phi)
  const far = foot(phi + Math.PI)
  s.ffx = near.x
  s.ffa = near.air
  s.ffl = near.lift
  s.bfx = far.x
  s.bfa = far.air
  s.bfl = far.lift
  // Arms swing opposite to the legs, bent near 90 degrees.
  const sh = shoulderOf(s.hx, s.hy, s.torso)
  const cNear = Math.cos(phi + Math.PI)
  const cFar = Math.cos(phi)
  s.bx = sh.x + 6 + 24 * cNear
  s.by = sh.y + 41 - 7 * cNear
  s.fhx = sh.x + 6 + 24 * cFar
  s.fhy = sh.y + 41 - 7 * cFar
  s.belt = -BELT_PER_CYCLE * t
}

function applyElliptical(s: RigState, t: number) {
  Object.assign(s, cardioBase)
  const th = t * TAU
  s.torso = 4
  s.head = -6
  s.hx = 194
  s.hy = 222 + 2.5 * Math.sin(2 * th)
  const pedal = (a: number) => ({ x: 200 + 30 * Math.cos(a), y: 324 + 9 * Math.sin(a) })
  const n = pedal(th)
  const f = pedal(th + Math.PI)
  s.ffx = n.x - 9
  s.ffa = ANKLE_Y - (n.y - 6)
  s.bfx = f.x - 9
  s.bfa = ANKLE_Y - (f.y - 6)
  s.bx = 236 + 18 * Math.cos(th + Math.PI)
  s.by = 216 + 3 * Math.sin(th)
  s.fhx = 236 + 18 * Math.cos(th)
  s.fhy = 216 - 3 * Math.sin(th)
  s.crank = th
}

function applyBike(s: RigState, t: number) {
  Object.assign(s, cardioBase)
  const th = t * TAU
  s.two = 0
  s.torso = 40
  s.head = -24
  s.hx = 182
  s.hy = 236 + 1.5 * Math.sin(2 * th)
  const pedal = (a: number) => ({ x: 214 + 20 * Math.cos(a), y: 318 + 20 * Math.sin(a) })
  const n = pedal(th)
  const f = pedal(th + Math.PI)
  s.ffx = n.x - 9
  s.ffa = ANKLE_Y - (n.y - 6)
  s.bfx = f.x - 9
  s.bfa = ANKLE_Y - (f.y - 6)
  s.bx = 262
  s.by = 210
  s.crank = th * 3
}

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3)
const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2

function applyRow(s: RigState, t: number) {
  Object.assign(s, cardioBase)
  s.two = 0
  // Drive is quick (legs, then body, then arms); recovery is slow and reversed.
  const DRIVE = 0.38
  const p = t < DRIVE ? easeInOutSine(t / DRIVE) * 0.85 + easeOutCubic(t / DRIVE) * 0.15 : 1 - easeInOutSine((t - DRIVE) / (1 - DRIVE))
  const legs = clamp01(p / 0.55)
  const body = clamp01((p - 0.35) / 0.4)
  const arms = clamp01((p - 0.62) / 0.38)
  s.hx = lerp(212, 168, legs)
  s.hy = 324
  s.torso = lerp(26, -22, body)
  s.head = -4
  s.ffx = 280
  s.bfx = 276
  s.ffa = 22
  s.bfa = 22
  s.ffl = lerp(6, 0, legs)
  s.bfl = s.ffl
  const sh = shoulderOf(s.hx, s.hy, s.torso)
  const reach = { x: sh.x + 80, y: sh.y + 46 }
  const pull = { x: sh.x + 16, y: sh.y + 30 }
  s.bx = lerp(reach.x, pull.x, arms)
  s.by = lerp(reach.y, pull.y, arms)
  s.crank = t * TAU * 2
}

function cardio(apply: (s: RigState, t: number) => void, seconds: number) {
  return (h: LifterHandle) => {
    const p = { t: 0 }
    return gsap.to(p, {
      t: 1,
      duration: seconds,
      ease: 'none',
      repeat: -1,
      onUpdate: () => {
        apply(h.state, p.t)
        h.render()
      },
    })
  }
}

const frame = (apply: (s: RigState, t: number) => void, t: number) => (s: RigState) => apply(s, t)
const stillPose = (p: Pose, extra: Partial<RigState> = {}) => (s: RigState) => Object.assign(s, p, { free: 0, shake: 0, ...extra })

export const STATION_RIGS: Record<StationId, StationRig> = {
  clean: {
    prop: 'platform',
    strength: true,
    start: POSES.setup,
    still: stillPose(POSES.lockout, { lights: 3, red: 0 }),
    play: (h, o = {}) => cleanAndJerk(h, { labels: true, onLockout: o.onLockout, onDrop: o.onImpact, effects: o.effects }),
  },
  squat: {
    prop: 'rack',
    strength: true,
    start: SQUAT.stand,
    still: stillPose(SQUAT.bottom),
    play: squatRep,
  },
  bench: {
    prop: 'bench',
    strength: true,
    start: BENCH.rack,
    still: stillPose(BENCH.top),
    play: benchRep,
  },
  deadlift: {
    prop: 'platform',
    strength: true,
    start: DEADLIFT.setup,
    still: stillPose(DEADLIFT.lockout, { lights: 3, red: 0 }),
    play: deadliftRep,
  },
  treadmill: {
    prop: 'treadmill',
    strength: false,
    start: pose({}),
    still: frame(applyRun, 0.15),
    play: cardio(applyRun, 0.72),
  },
  elliptical: {
    prop: 'elliptical',
    strength: false,
    start: pose({}),
    still: frame(applyElliptical, 0.1),
    play: cardio(applyElliptical, 1.15),
  },
  bike: {
    prop: 'bike',
    strength: false,
    start: pose({}),
    still: frame(applyBike, 0.1),
    play: cardio(applyBike, 0.62),
  },
  rower: {
    prop: 'rower',
    strength: false,
    start: pose({}),
    still: frame(applyRow, 0.3),
    play: cardio(applyRow, 2.2),
  },
}

/** Put the athlete at a station's starting frame, ready to play. */
export function prime(h: LifterHandle, id: StationId) {
  const rig = STATION_RIGS[id]
  Object.assign(h.state, { free: 0, shake: 0, lights: 0, red: 0, squash: 1, belt: 0, crank: 0 })
  if (rig.strength) Object.assign(h.state, rig.start, { po: 1 })
  else rig.still(h.state)
  h.render()
}

/** Human labels for the phase ticker. */
export const PHASE_LABELS: Record<string, string> = {
  setup: 'Set up',
  pull: 'Pull',
  catch: 'Catch',
  stand: 'Stand',
  jerk: 'Jerk',
  lockout: 'Good lift',
  down: 'Descend',
  drive: 'Drive',
  unrack: 'Unrack',
  lower: 'Lower',
  press: 'Press',
  rack: 'Rack it',
}
