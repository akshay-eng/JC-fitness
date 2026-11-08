import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { FLOOR, LIMB, initialState, skeleton, type Pose, type RigState } from './rig'

export type LifterHandle = {
  /** Mutable rig state. Tween it with GSAP, then call render(). */
  state: RigState
  render: () => void
  /** Put the rig in a pose instantly. */
  snap: (pose: Pose) => void
  /** Chalk puff from the hands. */
  burst: () => void
  /** Plate hits the floor: dust ring at the plate. */
  impact: () => void
}

type Props = {
  className?: string
  label?: string
  plateColor?: string
  /** Ring thickness, grows with the load in the Lift Lab. */
  plateStroke?: number
  lights?: boolean
  initial?: Pose
}

const LIGHT_X = [166, 200, 234]

export const Lifter = forwardRef<LifterHandle, Props>(function Lifter(
  { className, label = 'Animated lifter performing a clean and jerk', plateColor = 'var(--brand)', plateStroke = 11, lights = true, initial },
  ref,
) {
  const state = useRef<RigState>(initialState(initial)).current
  const el = useRef<Record<string, SVGElement | null>>({})
  const fx = useRef<SVGGElement>(null)

  const set = (key: string) => (node: SVGElement | null) => {
    el.current[key] = node
  }

  const render = () => {
    const e = el.current
    if (!e.torso) return
    const k = skeleton(state, performance.now() / 1000)
    const line = (node: SVGElement | null, a: { x: number; y: number }, b: { x: number; y: number }) => {
      if (!node) return
      node.setAttribute('x1', a.x.toFixed(1))
      node.setAttribute('y1', a.y.toFixed(1))
      node.setAttribute('x2', b.x.toFixed(1))
      node.setAttribute('y2', b.y.toFixed(1))
    }
    line(e.bThigh, k.hip, k.back.knee)
    line(e.bShin, k.back.knee, k.back.ankle)
    line(e.bFoot, k.back.ankle, k.back.toe)
    line(e.fThigh, k.hip, k.front.knee)
    line(e.fShin, k.front.knee, k.front.ankle)
    line(e.fFoot, k.front.ankle, k.front.toe)
    line(e.torso, k.hip, k.shoulder)
    line(e.upper, k.shoulder, k.elbow)
    line(e.fore, k.elbow, k.hand)
    e.head?.setAttribute('cx', k.head.x.toFixed(1))
    e.head?.setAttribute('cy', k.head.y.toFixed(1))

    const sq = state.squash
    const plate = `translate(${k.plate.x.toFixed(1)} ${k.plate.y.toFixed(1)}) scale(${(1 / Math.sqrt(sq)).toFixed(3)} ${sq.toFixed(3)})`
    e.plate?.setAttribute('transform', plate)
    e.farPlate?.setAttribute('transform', `translate(${(k.plate.x + 7).toFixed(1)} ${(k.plate.y - 5).toFixed(1)}) scale(${(1 / Math.sqrt(sq)).toFixed(3)} ${sq.toFixed(3)})`)

    // Shadow follows the body's centre of mass, tighter when the lifter is airborne.
    const cx = (k.front.ankle.x + k.back.ankle.x) / 2 + 8
    e.shadow?.setAttribute('cx', cx.toFixed(1))
    e.shadow?.setAttribute('rx', (46 - state.air * 2 + Math.abs(k.front.ankle.x - k.back.ankle.x) * 0.5).toFixed(1))

    if (lights) {
      for (let i = 0; i < 3; i++) {
        const node = e[`light${i}`]
        if (!node) continue
        const on = Math.max(0, Math.min(1, state.lights - i))
        node.setAttribute('fill-opacity', (0.12 + on * 0.88).toFixed(2))
        node.setAttribute('fill', state.red > 0.5 ? 'var(--no-lift)' : 'var(--fg)')
        ;(node as SVGElement).style.filter = on > 0.5 ? 'url(#jc-glow)' : 'none'
      }
    }
  }

  const spawn = (x: number, y: number, n: number, spread: number, color: string, rise: number) => {
    const g = fx.current
    if (!g) return
    for (let i = 0; i < n; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      c.setAttribute('cx', x.toFixed(1))
      c.setAttribute('cy', y.toFixed(1))
      c.setAttribute('r', (2 + Math.random() * 4).toFixed(1))
      c.setAttribute('fill', color)
      g.appendChild(c)
      const a = Math.random() * Math.PI * 2
      const dist = spread * (0.4 + Math.random() * 0.6)
      gsap.to(c, {
        attr: { cx: x + Math.cos(a) * dist, cy: y + Math.sin(a) * dist * 0.6 - rise * Math.random(), r: 0.5 },
        opacity: 0,
        duration: 0.7 + Math.random() * 0.5,
        ease: 'expo.out',
        onComplete: () => c.remove(),
      })
    }
  }

  useImperativeHandle(ref, () => ({
    state,
    render,
    snap: (pose) => {
      Object.assign(state, pose)
      render()
    },
    burst: () => {
      const k = skeleton(state)
      spawn(k.hand.x, k.hand.y, 16, 46, 'rgba(244,241,234,0.85)', 20)
    },
    impact: () => {
      const k = skeleton(state)
      spawn(k.plate.x, FLOOR - 4, 18, 70, 'rgba(244,241,234,0.55)', 12)
    },
  }))

  useLayoutEffect(render)

  // Trembling needs frames even when nothing is tweening.
  useEffect(() => {
    const tick = () => {
      if (state.shake > 0.01) render()
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <svg
      viewBox="0 -34 400 434"
      role="img"
      aria-label={label}
      className={cn('block h-auto w-full overflow-visible', className)}
    >
      <defs>
        <filter id="jc-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {lights && (
        <g aria-hidden="true">
          {LIGHT_X.map((x, i) => (
            <circle key={x} ref={set(`light${i}`)} cx={x} cy={-14} r={9} fill="var(--fg)" fillOpacity={0.12} />
          ))}
        </g>
      )}

      {/* platform */}
      <g aria-hidden="true">
        <rect x={60} y={FLOOR} width={290} height={10} rx={2} fill="var(--surface-3, #222)" />
        <rect x={150} y={FLOOR} width={110} height={10} fill="var(--surface-4, #2a2a2a)" />
        <ellipse ref={set('shadow')} cx={208} cy={FLOOR + 1} rx={46} ry={5} fill="#000" opacity={0.55} />
      </g>

      <g aria-hidden="true" strokeLinecap="round" fill="none">
        {/* far plate: behind the body, for depth */}
        <g ref={set('farPlate')} opacity={0.35}>
          <circle r={LIMB.plate - plateStroke / 2} stroke={plateColor} strokeWidth={plateStroke} />
        </g>

        <g stroke="var(--fg)" strokeOpacity={0.42}>
          <line ref={set('bThigh')} strokeWidth={21} />
          <line ref={set('bShin')} strokeWidth={17} />
          <line ref={set('bFoot')} strokeWidth={9} />
        </g>

        <g stroke="var(--fg)">
          <line ref={set('torso')} strokeWidth={30} />
          <line ref={set('fThigh')} strokeWidth={22} />
          <line ref={set('fShin')} strokeWidth={18} />
          <line ref={set('fFoot')} strokeWidth={10} />
          <line ref={set('upper')} strokeWidth={16} />
          <line ref={set('fore')} strokeWidth={13} />
        </g>
        <circle ref={set('head')} r={LIMB.head} fill="var(--fg)" stroke="none" />

        {/* near plate: in front of everything, a ring so the body reads through it */}
        <g ref={set('plate')}>
          <circle r={LIMB.plate - plateStroke / 2} stroke={plateColor} strokeWidth={plateStroke} />
          <circle r={7} fill="var(--fg)" stroke="var(--bg)" strokeWidth={3} />
        </g>
      </g>

      <g ref={fx} aria-hidden="true" />
    </svg>
  )
})
