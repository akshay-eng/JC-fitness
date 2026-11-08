import { gsap } from '@/lib/gsap'
import type { LifterHandle } from './Lifter'
import { FLOOR, LIMB, POSES, type Pose } from './rig'

const KEYS = ['hx', 'hy', 'torso', 'bx', 'by', 'ffx', 'bfx', 'ffl', 'bfl', 'air', 'head'] as const

const vars = (p: Pose) => Object.fromEntries(KEYS.map((k) => [k, p[k]])) as Record<(typeof KEYS)[number], number>

type Options = {
  /** Pauses between phases. Off for the scroll-scrubbed version. */
  holds?: boolean
  /** Drop the bar after lockout, celebrate, walk back to it. */
  drop?: boolean
  /** Tempo multiplier, >1 is faster. */
  speed?: number
  onCatch?: () => void
  onLockout?: () => void
  onDrop?: () => void
  /** Labels each phase so scroll UIs can show where the lift is. */
  labels?: boolean
  /** Chalk and dust particles. Off when scrubbed: scrubbing back and forth would spray them. */
  effects?: boolean
}

/**
 * A full clean & jerk. Timing follows the physics of a loaded bar: slow off
 * the floor, explosive through the extension, a heavy grind out of the catch.
 */
export function cleanAndJerk(h: LifterHandle, o: Options = {}) {
  const { holds = true, drop = true, speed = 1, labels = false, effects = true } = o
  const s = h.state
  const tl = gsap.timeline({ onUpdate: h.render })
  const hold = (t: number) => holds && tl.to({}, { duration: t / speed })
  const to = (p: Pose, d: number, ease: string, extra: gsap.TweenVars = {}) =>
    tl.to(s, { ...vars(p), duration: d / speed, ease, ...extra })
  const label = (name: string) => labels && tl.addLabel(name)

  label('setup')
  hold(0.5)
  to(POSES.wedge, 0.45, 'sine.inOut')
  hold(0.15)
  label('pull')
  to(POSES.knee, 0.42, 'power2.in')
  to(POSES.power, 0.16, 'none')
  to(POSES.extend, 0.12, 'power3.out')
  to(POSES.turnover, 0.12, 'power2.out')
  label('catch')
  to(POSES.catch, 0.16, 'power3.out')
  tl.call(() => o.onCatch?.())
  tl.fromTo(s, { squash: 0.88 }, { squash: 1, duration: 0.4 / speed, ease: 'elastic.out(1, 0.35)' }, '<')
  hold(0.25)
  label('stand')
  to(POSES.stand, 0.8, 'power2.inOut')
  tl.fromTo(s, { shake: 2.2 }, { shake: 0, duration: 0.8 / speed, ease: 'power1.in' }, '<')
  hold(0.35)
  label('jerk')
  to(POSES.dip, 0.22, 'power2.in')
  to(POSES.drive, 0.1, 'power3.out')
  to(POSES.split, 0.14, 'power3.out')
  hold(0.2)
  to(POSES.splitIn, 0.32, 'power2.inOut')
  to(POSES.lockout, 0.3, 'power2.inOut')
  label('lockout')
  tl.call(() => {
    if (effects) h.burst()
    o.onLockout?.()
  })
  tl.set(s, { red: 0 })
  tl.to(s, { lights: 3, duration: 0.45 / speed, ease: 'steps(3)' })
  tl.to(s, { by: POSES.lockout.by + 3, duration: 0.08 / speed, yoyo: true, repeat: 3, ease: 'sine.inOut' }, '<')

  if (!drop) return tl

  hold(0.9)
  // Release: the plate leaves the hands where they are and falls on its own.
  tl.call(() => {
    s.px = s.bx
    s.py = s.by
  })
  tl.set(s, { free: 1 })
  tl.to(s, { py: FLOOR - LIMB.plate, duration: 0.75 / speed, ease: 'bounce.out' })
  tl.to(s, { px: POSES.lockout.bx + 38, duration: 0.75 / speed, ease: 'power1.out' }, '<')
  to(POSES.release, 0.35, 'power2.out', { delay: 0 })
  tl.call(
    () => {
      h.impact()
      o.onDrop?.()
    },
    [],
    `<${0.27 / speed}`,
  )
  tl.fromTo(s, { squash: 0.82 }, { squash: 1, duration: 0.35 / speed, ease: 'elastic.out(1, 0.4)' }, '<')
  tl.to(s, { lights: 0, duration: 0.2 / speed }, `>${0.3 / speed}`)
  to(POSES.flex, 0.3, 'back.out(2)')
  hold(0.6)
  // Walk back to the bar: the hands meet the plate on the floor.
  to(POSES.setup, 0.8, 'power2.inOut')
  tl.to(s, { free: 0, duration: 0.8 / speed, ease: 'power2.inOut' }, '<')
  return tl
}

/** A missed lift: the bar stalls at the knee and goes back down. */
export function missedLift(h: LifterHandle, strain: number, o: { onDrop?: () => void } = {}) {
  const s = h.state
  const tl = gsap.timeline({ onUpdate: h.render })
  tl.to(s, { ...vars(POSES.knee), duration: 0.9, ease: 'power1.inOut' })
  tl.to(s, { shake: 2 + strain * 3, duration: 0.3 }, '<')
  tl.to(s, { hy: POSES.knee.hy + 4, duration: 0.5, ease: 'sine.inOut' })
  tl.to(s, { ...vars(POSES.setup), shake: 0, duration: 0.32, ease: 'power3.in' })
  tl.call(() => {
    h.impact()
    o.onDrop?.()
  })
  tl.fromTo(s, { squash: 0.84 }, { squash: 1, duration: 0.35, ease: 'elastic.out(1, 0.4)' })
  tl.set(s, { red: 1 }, '<')
  tl.to(s, { lights: 3, duration: 0.45, ease: 'steps(3)' }, '<')
  return tl
}

export { POSES }
