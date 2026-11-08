/**
 * The JC athlete: an Olympic-pictogram figure seen side-on, facing right.
 *
 * A pose names where the hips, feet and hands should be, plus the torso
 * angle. Knees and elbows are solved with two-bone inverse kinematics, so any
 * pose a timeline tweens through stays anatomically plausible.
 *
 * Coordinates are SVG units in a 400-wide stage; the floor sits at y = 360.
 */

export const FLOOR = 360
export const ANKLE_Y = 352

export const LIMB = {
  shin: 56,
  thigh: 60,
  torso: 84,
  upperArm: 48,
  forearm: 46,
  neck: 24,
  head: 15,
  plate: 40,
} as const

export type Pose = {
  /** Hip position. */
  hx: number
  hy: number
  /** Torso lean from vertical in degrees; positive leans forward, -90 lies on the back. */
  torso: number
  /** Where the near hand (and the bar) wants to be. */
  bx: number
  by: number
  /** Ankle x of the front and back foot. */
  ffx: number
  bfx: number
  /** Heel lift of each foot (on the toes), in px. */
  ffl: number
  bfl: number
  /** Whole foot off the floor, per foot (pedals, a running stride), in px. */
  ffa: number
  bfa: number
  /** Both feet off the floor, in px. */
  air: number
  /** Head tilt relative to the torso, degrees. */
  head: number
  /** Which way the elbows bend: 1 natural, -1 for a back-squat grip. */
  eb: number
  /** 0: the far hand holds the bar with the near one. 1: it goes to (fhx, fhy). */
  two: number
  fhx: number
  fhy: number
  /** Plate visibility, 0..1 (cardio has no bar). */
  po: number
}

export type RigState = Pose & {
  /** 0 = plate in the hands, 1 = plate free at (px, py). */
  free: number
  px: number
  py: number
  /** Plate squash on impact (1 = round). */
  squash: number
  /** Trembling under load, in px. */
  shake: number
  /** Judge lights lit, 0..3. */
  lights: number
  /** 0 = white (good lift), 1 = red (no lift). */
  red: number
  /** Treadmill belt offset, px. */
  belt: number
  /** Flywheel / crank angle, radians. */
  crank: number
}

export const BASE_POSE: Pose = {
  hx: 163, hy: 284, torso: 50, bx: 214, by: 320,
  ffx: 200, bfx: 200, ffl: 0, bfl: 0, ffa: 0, bfa: 0, air: 0, head: -18,
  eb: 1, two: 0, fhx: 0, fhy: 0, po: 1,
}

export const pose = (o: Partial<Pose>): Pose => ({ ...BASE_POSE, ...o })

/** Clean & jerk, start to finish. */
export const POSES = {
  setup: pose({}),
  /** Hips sink a touch before the pull: anticipation. */
  wedge: pose({ hx: 160, hy: 290, torso: 52, head: -20 }),
  knee: pose({ hx: 172, hy: 262, torso: 42, bx: 213, by: 290, head: -14 }),
  power: pose({ hx: 180, hy: 244, torso: 24, bx: 210, by: 258, head: -6 }),
  extend: pose({ hx: 194, hy: 226, torso: -10, bx: 204, by: 226, ffl: 10, bfl: 10, head: 4 }),
  turnover: pose({ hx: 190, hy: 262, torso: 4, bx: 210, by: 186, air: 8, head: 0 }),
  catch: pose({ hx: 182, hy: 300, torso: 16, bx: 211, by: 205, head: -8 }),
  stand: pose({ hx: 199, hy: 238, torso: 3, bx: 209, by: 140, head: -2 }),
  dip: pose({ hx: 196, hy: 252, torso: 3, bx: 206, by: 154, head: -2 }),
  drive: pose({ hx: 198, hy: 232, torso: 2, bx: 204, by: 104, ffl: 8, bfl: 8, head: 0 }),
  split: pose({ hx: 198, hy: 262, torso: 0, bx: 200, by: 86, ffx: 244, bfx: 150, bfl: 9, head: 0 }),
  splitIn: pose({ hx: 199, hy: 248, torso: 0, bx: 201, by: 72, ffx: 214, bfx: 150, bfl: 9, head: 0 }),
  lockout: pose({ hx: 200, hy: 238, torso: 0, bx: 202, by: 62, ffx: 200, bfx: 196, head: 0 }),
  /** Hands back at the hips once the bar is dropped. */
  release: pose({ hx: 198, hy: 238, torso: 2, bx: 212, by: 246, ffx: 196, bfx: 188, head: 6 }),
  /** Fists up. */
  flex: pose({ hx: 200, hy: 236, torso: -2, bx: 226, by: 96, ffx: 200, bfx: 192, head: -10 }),
} satisfies Record<string, Pose>

export type PoseName = keyof typeof POSES

export function initialState(p: Pose = POSES.setup): RigState {
  return { ...p, free: 0, px: p.bx, py: p.by, squash: 1, shake: 0, lights: 0, red: 0, belt: 0, crank: 0 }
}

type Pt = { x: number; y: number }

/**
 * Two-bone IK. `side` picks which way the middle joint bends: legs use -1
 * (knee forward), arms +1 (elbow back when hanging, forward in the rack).
 */
function solve(a: Pt, target: Pt, l1: number, l2: number, side: number) {
  const dx = target.x - a.x
  const dy = target.y - a.y
  const d = Math.hypot(dx, dy)
  const dc = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, d))
  const baseAngle = Math.atan2(dy, dx)
  const cos = (l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc)
  const bend = Math.acos(Math.max(-1, Math.min(1, cos)))
  const ang = baseAngle + side * bend
  return {
    joint: { x: a.x + l1 * Math.cos(ang), y: a.y + l1 * Math.sin(ang) },
    end: { x: a.x + Math.cos(baseAngle) * dc, y: a.y + Math.sin(baseAngle) * dc },
  }
}

const rad = (deg: number) => (deg * Math.PI) / 180

/** Where the shoulders sit for a hip position and torso lean. */
export function shoulderOf(hx: number, hy: number, torso: number): Pt {
  return { x: hx + LIMB.torso * Math.sin(rad(torso)), y: hy - LIMB.torso * Math.cos(rad(torso)) }
}

export type Foot = { knee: Pt; ankle: Pt; toe: Pt }

export type Skeleton = {
  hip: Pt
  shoulder: Pt
  head: Pt
  front: Foot
  back: Foot
  elbow: Pt
  hand: Pt
  farElbow: Pt
  farHand: Pt
  plate: Pt
}

export function skeleton(s: RigState, time = 0): Skeleton {
  // Tremble: two incommensurate sines read as strain, not as a vibration.
  const jx = s.shake ? Math.sin(time * 71) * s.shake * 0.6 + Math.sin(time * 113) * s.shake * 0.4 : 0
  const jy = s.shake ? Math.sin(time * 89) * s.shake * 0.5 : 0

  const hip = { x: s.hx + jx * 0.5, y: s.hy - s.air + jy * 0.5 }
  const sh = shoulderOf(hip.x, hip.y, s.torso)
  const shoulder = { x: sh.x + jx, y: sh.y + jy }
  const neckAngle = rad(s.torso * 0.7 + s.head)
  const head = {
    x: shoulder.x + LIMB.neck * Math.sin(neckAngle),
    y: shoulder.y - LIMB.neck * Math.cos(neckAngle),
  }

  const leg = (ax: number, lift: number, footAir: number): Foot => {
    const target = { x: ax, y: ANKLE_Y - lift - s.air - footAir }
    const { joint, end } = solve(hip, target, LIMB.thigh, LIMB.shin, -1)
    return { knee: joint, ankle: end, toe: { x: end.x + 19, y: FLOOR - 2 - s.air - footAir } }
  }

  const front = leg(s.ffx, s.ffl, s.ffa)
  const back = leg(s.bfx, s.bfl, s.bfa)

  const side = s.eb < 0 ? -1 : 1
  const nearTarget = { x: s.bx + jx, y: s.by + jy }
  const arm = solve(shoulder, nearTarget, LIMB.upperArm, LIMB.forearm, side)
  const farTarget = s.two > 0.5 ? { x: s.fhx, y: s.fhy } : nearTarget
  const far = solve(shoulder, farTarget, LIMB.upperArm, LIMB.forearm, side)
  const hand = arm.end
  const plate = {
    x: hand.x + (s.px - hand.x) * s.free,
    y: hand.y + (s.py - hand.y) * s.free,
  }

  return { hip, shoulder, head, front, back, elbow: arm.joint, hand, farElbow: far.joint, farHand: far.end, plate }
}
