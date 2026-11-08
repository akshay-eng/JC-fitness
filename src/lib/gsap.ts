import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * House motion constants (motion-design "Energetic" personality).
 * Signature ease for 80% of moves, three durations, one entrance pattern.
 */
export const EASE = {
  /** Strong ease-out: entrances and exits. */
  out: 'expo.out',
  /** On-screen movement. */
  inOut: 'power3.inOut',
  /** Heavy things: a loaded bar, a body under load. */
  heavy: 'power2.inOut',
} as const

export const DUR = { quick: 0.18, base: 0.35, slow: 0.7 } as const

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

export { gsap, ScrollTrigger }
