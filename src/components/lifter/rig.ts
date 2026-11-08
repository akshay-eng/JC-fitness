/**
 * The JC lifter: an Olympic-pictogram athlete seen side-on, facing right.
 *
 * A pose names where the hips, feet and hands (the bar) should be, plus the
 * torso angle. Knees and elbows are solved with two-bone inverse kinematics,
 * so any pose the timeline tweens through stays anatomically plausible: knees
 * always bend forward, elbows always bend the way an elbow does.
 *
 * Coordinates are SVG units in a 400-wide stage; the floor sits at y = 360.
 */

export const FLOOR = 360
const ANKLE_Y = 352

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
  /** Torso lean from vertical in degrees; positive leans forward. */
  torso: number
  /** Where the hands (and so the bar) want to be. */
  bx: number
  by: number
  /** Ankle x of the front and back foot. */
  ffx: number
  bfx: number
  /** Heel lift of each foot (on the toes), in px. */
  ffl: number
  bfl: number
  /** Both feet off the floor, in px. */
  air: number
  /** Head tilt relative to the torso, degrees. */
  head: number
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
}

const base: Pose = {
  hx: 163, hy: 284, torso: 50, bx: 214, by: 320,
  ffx: 200, bfx: 200, ffl: 0, bfl: 0, air: 0, head: -18,
}

const p = (o: Partial<Pose>): Pose => ({ ...base, ...o })

/** A clean & jerk, start to finish. */
export const POSES = {
  setup: p({}),
  /** Hips sink a touch before the pull: anticipation. */
  wedge: p({ hx: 160, hy: 290, torso: 52, head: -20 }),
  knee: p({ hx: 172, hy: 262, torso: 42, bx: 213, by: 290, head: -14 }),
  power: p({ hx: 180, hy: 244, torso: 24, bx: 210, by: 258, head: -6 }),
  extend: p({ hx: 194, hy: 226, torso: -10, bx: 204, by: 226, ffl: 10, bfl: 10, head: 4 }),
  turnover: p({ hx: 190, hy: 262, torso: 4, bx: 210, by: 186, air: 8, head: 0 }),
  catch: p({ hx: 182, hy: 300, torso: 16, bx: 211, by: 205, head: -8 }),
  stand: p({ hx: 199, hy: 238, torso: 3, bx: 209, by: 140, head: -2 }),
  dip: p({ hx: 196, hy: 252, torso: 3, bx: 206, by: 154, head: -2 }),
  drive: p({ hx: 198, hy: 232, torso: 2, bx: 204, by: 104, ffl: 8, bfl: 8, head: 0 }),
  split: p({ hx: 198, hy: 262, torso: 0, bx: 200, by: 86, ffx: 244, bfx: 150, bfl: 9, head: 0 }),
  splitIn: p({ hx: 199, hy: 248, torso: 0, bx: 201, by: 72, ffx: 214, bfx: 150, bfl: 9, head: 0 }),
  lockout: p({ hx: 200, hy: 238, torso: 0, bx: 202, by: 62, ffx: 200, bfx: 196, head: 0 }),
  /** Hands back at the hips once the bar is dropped. */
  release: p({ hx: 198, hy: 238, torso: 2, bx: 212, by: 246, ffx: 196, bfx: 188, head: 6 }),
  /** Fists up. */
  flex: p({ hx: 200, hy: 236, torso: -2, bx: 226, by: 96, ffx: 200, bfx: 192, head: -10 }),
} satisfies Record<string, Pose>

export type PoseName = keyof typeof POSES

export function initialState(pose: Pose = POSES.setup): RigState {
  return {
    ...pose,
    free: 0,
    px: pose.bx,
    py: pose.by,
    squash: 1,
    shake: 0,
    lights: 0,
    red: 0,
  }
}

type Pt = { x: number; y: number }

/**
 * Two-bone IK. `side` picks which way the middle joint bends: legs use -1
 * (knee forward), arms +1 (elbow back when hanging, forward in the rack).
 */
function solve(a: Pt, target: Pt, l1: number, l2: number, side: 1 | -1) {
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

export type Skeleton = {
  hip: Pt
  shoulder: Pt
  head: Pt
  front: { knee: Pt; ankle: Pt; toe: Pt }
  back: { knee: Pt; ankle: Pt; toe: Pt }
  elbow: Pt
  hand: Pt
  plate: Pt
}

export function skeleton(s: RigState, time = 0): Skeleton {
  // Tremble: two incommensurate sines read as strain, not as a vibration.
  const jx = s.shake ? Math.sin(time * 71) * s.shake * 0.6 + Math.sin(time * 113) * s.shake * 0.4 : 0
  const jy = s.shake ? Math.sin(time * 89) * s.shake * 0.5 : 0

  const hip = { x: s.hx + jx * 0.5, y: s.hy - s.air + jy * 0.5 }
  const shoulder = {
    x: hip.x + LIMB.torso * Math.sin(rad(s.torso)) + jx,
    y: hip.y - LIMB.torso * Math.cos(rad(s.torso)) + jy,
  }
  const neckAngle = rad(s.torso * 0.7 + s.head)
  const head = {
    x: shoulder.x + LIMB.neck * Math.sin(neckAngle),
    y: shoulder.y - LIMB.neck * Math.cos(neckAngle),
  }

  const leg = (ax: number, lift: number) => {
    const target = { x: ax, y: ANKLE_Y - lift - s.air }
    const { joint, end } = solve(hip, target, LIMB.thigh, LIMB.shin, -1)
    const toe = { x: end.x + 19, y: FLOOR - 2 - s.air }
    return { knee: joint, ankle: end, toe }
  }

  const front = leg(s.ffx, s.ffl)
  const back = leg(s.bfx, s.bfl)

  const arm = solve(shoulder, { x: s.bx + jx, y: s.by + jy }, LIMB.upperArm, LIMB.forearm, 1)
  const hand = arm.end
  const plate = {
    x: hand.x + (s.px - hand.x) * s.free,
    y: hand.y + (s.py - hand.y) * s.free,
  }

  return { hip, shoulder, head, front, back, elbow: arm.joint, hand, plate }
}
