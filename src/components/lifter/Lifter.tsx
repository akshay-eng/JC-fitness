import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { FLOOR, LIMB, initialState, skeleton, type Pose, type RigState, type Skeleton } from './rig'

export type PropKind = 'platform' | 'rack' | 'bench' | 'treadmill' | 'elliptical' | 'bike' | 'rower'

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
  /** The equipment around the athlete. */
  prop?: PropKind
}

const LIGHT_X = [166, 200, 234]
const STRENGTH: PropKind[] = ['platform', 'rack', 'bench']
/** Flywheel centres, for spinning spokes. */
const HUB: Partial<Record<PropKind, { x: number; y: number }>> = {
  elliptical: { x: 126, y: 314 },
  bike: { x: 268, y: 312 },
  rower: { x: 352, y: 312 },
}
const ELLIPTICAL_PIVOT = { x: 290, y: 284 }
const BIKE_CRANK = { x: 214, y: 318 }
const ROWER_EXIT = { x: 326, y: 300 }

const FRAME = 'rgb(234 242 247 / 0.2)'
const FRAME_SOFT = 'rgb(234 242 247 / 0.12)'
const FILL = 'var(--surface-4, #232328)'
const FILL_HI = 'var(--surface-6, #313137)'

export const Lifter = forwardRef<LifterHandle, Props>(function Lifter(
  {
    className,
    label = 'Animated athlete',
    plateColor = 'var(--brand)',
    plateStroke = 11,
    lights = true,
    initial,
    prop = 'platform',
  },
  ref,
) {
  const state = useRef<RigState>(initialState(initial)).current
  const el = useRef<Record<string, SVGElement | null>>({})
  const fx = useRef<SVGGElement>(null)
  const propRef = useRef(prop)
  propRef.current = prop
  const showLights = lights && STRENGTH.includes(prop)

  const set = (key: string) => (node: SVGElement | null) => {
    el.current[key] = node
  }

  const updateProp = (k: Skeleton) => {
    const e = el.current
    const kind = propRef.current
    const hub = HUB[kind]
    if (hub && e.spokes) e.spokes.setAttribute('transform', `rotate(${((state.crank * 180) / Math.PI).toFixed(1)} ${hub.x} ${hub.y})`)

    if (kind === 'treadmill') {
      e.belt?.setAttribute('stroke-dashoffset', state.belt.toFixed(1))
    } else if (kind === 'elliptical') {
      const c = HUB.elliptical!
      const feet = [
        { foot: k.front, hand: k.hand, sign: 1, arm: e.aNear, pedal: e.pNear, handle: e.hNear },
        { foot: k.back, hand: k.farHand, sign: -1, arm: e.aFar, pedal: e.pFar, handle: e.hFar },
      ]
      for (const f of feet) {
        const pin = { x: c.x + 18 * Math.cos(state.crank) * f.sign, y: c.y + 18 * Math.sin(state.crank) * f.sign }
        const pedal = { x: f.foot.ankle.x + 9, y: f.foot.ankle.y + 6 }
        const pv = ELLIPTICAL_PIVOT
        const low = { x: pv.x + (pv.x - f.hand.x) * 0.5, y: pv.y + (pv.y - f.hand.y) * 0.5 }
        const top = { x: f.hand.x + (f.hand.x - pv.x) * 0.16, y: f.hand.y + (f.hand.y - pv.y) * 0.16 }
        f.arm?.setAttribute('points', `${pin.x.toFixed(1)},${pin.y.toFixed(1)} ${pedal.x.toFixed(1)},${(pedal.y + 4).toFixed(1)} ${low.x.toFixed(1)},${low.y.toFixed(1)}`)
        f.pedal?.setAttribute('transform', `translate(${(pedal.x - 21).toFixed(1)} ${pedal.y.toFixed(1)})`)
        f.handle?.setAttribute('x1', low.x.toFixed(1))
        f.handle?.setAttribute('y1', low.y.toFixed(1))
        f.handle?.setAttribute('x2', top.x.toFixed(1))
        f.handle?.setAttribute('y2', top.y.toFixed(1))
      }
    } else if (kind === 'bike') {
      const c = BIKE_CRANK
      for (const [foot, arm, pedal] of [
        [k.front, e.cNear, e.pNear],
        [k.back, e.cFar, e.pFar],
      ] as const) {
        const p = { x: foot.ankle.x + 9, y: foot.ankle.y + 6 }
        arm?.setAttribute('x1', String(c.x))
        arm?.setAttribute('y1', String(c.y))
        arm?.setAttribute('x2', p.x.toFixed(1))
        arm?.setAttribute('y2', p.y.toFixed(1))
        pedal?.setAttribute('transform', `translate(${(p.x - 10).toFixed(1)} ${p.y.toFixed(1)})`)
      }
    } else if (kind === 'rower') {
      e.seat?.setAttribute('transform', `translate(${(k.hip.x - 22).toFixed(1)} 0)`)
      e.chain?.setAttribute('x2', k.hand.x.toFixed(1))
      e.chain?.setAttribute('y2', k.hand.y.toFixed(1))
      e.grip?.setAttribute('cx', k.hand.x.toFixed(1))
      e.grip?.setAttribute('cy', k.hand.y.toFixed(1))
    }
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
    line(e.fUpper, k.shoulder, k.farElbow)
    line(e.fFore, k.farElbow, k.farHand)
    e.head?.setAttribute('cx', k.head.x.toFixed(1))
    e.head?.setAttribute('cy', k.head.y.toFixed(1))

    const sq = state.squash
    const scale = `scale(${(1 / Math.sqrt(sq)).toFixed(3)} ${sq.toFixed(3)})`
    e.plate?.setAttribute('transform', `translate(${k.plate.x.toFixed(1)} ${k.plate.y.toFixed(1)}) ${scale}`)
    e.farPlate?.setAttribute('transform', `translate(${(k.plate.x + 7).toFixed(1)} ${(k.plate.y - 5).toFixed(1)}) ${scale}`)
    const po = state.po.toFixed(2)
    e.plate?.setAttribute('opacity', po)
    e.farPlate?.setAttribute('opacity', (state.po * 0.35).toFixed(2))

    if (e.shadow) {
      const cx = (k.front.ankle.x + k.back.ankle.x) / 2 + 8
      e.shadow.setAttribute('cx', cx.toFixed(1))
      e.shadow.setAttribute('rx', (46 - state.air * 2 + Math.abs(k.front.ankle.x - k.back.ankle.x) * 0.5).toFixed(1))
    }

    for (let i = 0; i < 3; i++) {
      const node = e[`light${i}`]
      if (!node) continue
      const on = Math.max(0, Math.min(1, state.lights - i))
      node.setAttribute('fill-opacity', (0.12 + on * 0.88).toFixed(2))
      node.setAttribute('fill', state.red > 0.5 ? 'var(--no-lift)' : 'var(--fg)')
      ;(node as SVGElement).style.filter = on > 0.5 ? 'url(#jc-glow)' : 'none'
    }

    updateProp(k)
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
    snap: (p) => {
      Object.assign(state, p)
      render()
    },
    burst: () => {
      const k = skeleton(state)
      spawn(k.hand.x, k.hand.y, 16, 46, 'rgba(234,242,247,0.85)', 20)
    },
    impact: () => {
      const k = skeleton(state)
      spawn(k.plate.x, FLOOR - 4, 18, 70, 'rgba(234,242,247,0.55)', 12)
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
    <svg viewBox="0 -34 400 434" role="img" aria-label={label} className={cn('block h-auto w-full overflow-visible', className)}>
      <defs>
        <filter id="jc-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {showLights && (
        <g aria-hidden="true">
          {LIGHT_X.map((x, i) => (
            <circle key={x} ref={set(`light${i}`)} cx={x} cy={-14} r={9} fill="var(--fg)" fillOpacity={0.12} />
          ))}
        </g>
      )}

      <g aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
        <PropBack kind={prop} set={set} />
      </g>

      <g aria-hidden="true" strokeLinecap="round" fill="none">
        {/* far side of the body, dimmer, for depth */}
        <g stroke="var(--fg)" strokeOpacity={0.42}>
          <line ref={set('fUpper')} strokeWidth={15} />
          <line ref={set('fFore')} strokeWidth={12} />
        </g>
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
        </g>
      </g>

      <g aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
        <PropFront kind={prop} set={set} />
      </g>

      <g aria-hidden="true" strokeLinecap="round" fill="none">
        <g stroke="var(--fg)">
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

type SetRef = (key: string) => (node: SVGElement | null) => void

function Spokes({ cx, cy, r, set }: { cx: number; cy: number; r: number; set: SetRef }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={FILL} stroke={FRAME} strokeWidth={4} />
      <g ref={set('spokes')} stroke="rgb(234 242 247 / 0.3)" strokeWidth={3}>
        <line x1={cx - r + 7} y1={cy} x2={cx + r - 7} y2={cy} />
        <line x1={cx} y1={cy - r + 7} x2={cx} y2={cy + r - 7} />
        <circle cx={cx + r - 11} cy={cy} r={3} fill="var(--brand)" stroke="none" />
      </g>
      <circle cx={cx} cy={cy} r={5} fill={FILL_HI} />
    </g>
  )
}

const Floor = () => <rect x={30} y={FLOOR + 2} width={340} height={5} rx={2} fill="var(--surface-3, #1d1d21)" />

/** Equipment behind the athlete. Moving parts are positioned by render(). */
function PropBack({ kind, set }: { kind: PropKind; set: SetRef }) {
  switch (kind) {
    case 'platform':
    case 'rack':
      return (
        <g>
          {kind === 'rack' && (
            <g stroke={FRAME_SOFT} fill="none">
              <line x1={140} y1={FLOOR} x2={140} y2={46} strokeWidth={8} />
              <line x1={282} y1={FLOOR} x2={282} y2={46} strokeWidth={8} />
              <line x1={140} y1={46} x2={282} y2={46} strokeWidth={7} />
              <line x1={126} y1={264} x2={296} y2={264} strokeWidth={5} stroke={FRAME} />
              <path d="M282 160 h-15 v-9" strokeWidth={5} stroke={FRAME} />
            </g>
          )}
          <rect x={60} y={FLOOR} width={290} height={10} rx={2} fill="var(--surface-3, #222)" />
          <rect x={150} y={FLOOR} width={110} height={10} fill="var(--surface-4, #2a2a2a)" />
          <ellipse ref={set('shadow')} cx={208} cy={FLOOR + 1} rx={46} ry={5} fill="#000" opacity={0.55} />
        </g>
      )
    case 'bench':
      return (
        <g>
          <Floor />
          <g stroke={FRAME} fill="none">
            <line x1={128} y1={FLOOR} x2={128} y2={188} strokeWidth={8} />
            <path d="M128 198 h16 v-9" strokeWidth={5} />
            <line x1={124} y1={322} x2={124} y2={FLOOR} strokeWidth={8} />
            <line x1={240} y1={322} x2={240} y2={FLOOR} strokeWidth={8} />
            <line x1={108} y1={FLOOR} x2={146} y2={FLOOR} strokeWidth={6} />
            <line x1={222} y1={FLOOR} x2={258} y2={FLOOR} strokeWidth={6} />
          </g>
          <rect x={104} y={310} width={158} height={13} rx={6} fill={FILL_HI} />
          <rect x={108} y={310} width={150} height={3} rx={1.5} fill="rgb(234 242 247 / 0.12)" />
        </g>
      )
    case 'treadmill':
      return (
        <g>
          <rect x={30} y={FLOOR + 14} width={340} height={5} rx={2} fill="var(--surface-3, #1d1d21)" />
          <g stroke={FRAME} fill="none">
            <line x1={330} y1={FLOOR + 4} x2={312} y2={212} strokeWidth={10} />
            <line x1={316} y1={238} x2={244} y2={250} strokeWidth={6} />
          </g>
          <polygon points="290,206 338,188 343,203 295,221" fill={FILL_HI} />
          <line x1={300} y1={209} x2={330} y2={198} stroke="var(--volt)" strokeWidth={2.5} opacity={0.8} />
          <rect x={88} y={FLOOR - 1} width={254} height={15} rx={7.5} fill={FILL} />
          <circle cx={97} cy={FLOOR + 6.5} r={5} fill={FILL_HI} />
          <circle cx={333} cy={FLOOR + 6.5} r={5} fill={FILL_HI} />
          <line ref={set('belt')} x1={96} y1={FLOOR} x2={334} y2={FLOOR} stroke="rgb(234 242 247 / 0.3)" strokeWidth={3} strokeDasharray="14 20" />
        </g>
      )
    case 'elliptical':
      return (
        <g>
          <Floor />
          <g stroke={FRAME} fill="none">
            <line x1={104} y1={352} x2={318} y2={352} strokeWidth={8} />
            <line x1={92} y1={FLOOR} x2={146} y2={FLOOR} strokeWidth={7} />
            <line x1={282} y1={FLOOR} x2={330} y2={FLOOR} strokeWidth={7} />
            <line x1={304} y1={352} x2={294} y2={190} strokeWidth={10} />
          </g>
          <rect x={276} y={168} width={36} height={22} rx={5} fill={FILL_HI} />
          <line x1={283} y1={177} x2={305} y2={177} stroke="var(--volt)" strokeWidth={2.5} opacity={0.8} />
          <Spokes cx={126} cy={314} r={30} set={set} />
          <g opacity={0.5}>
            <polyline ref={set('aFar')} fill="none" stroke={FRAME} strokeWidth={6} />
            <g ref={set('pFar')}>
              <rect width={42} height={7} rx={3} fill={FILL_HI} />
            </g>
            <line ref={set('hFar')} stroke="rgb(234 242 247 / 0.35)" strokeWidth={7} />
          </g>
          <circle cx={ELLIPTICAL_PIVOT.x} cy={ELLIPTICAL_PIVOT.y} r={6} fill={FILL_HI} />
        </g>
      )
    case 'bike':
      return (
        <g>
          <Floor />
          <g stroke={FRAME} fill="none">
            <line x1={104} y1={FLOOR - 2} x2={156} y2={FLOOR - 2} strokeWidth={8} />
            <line x1={248} y1={FLOOR - 2} x2={306} y2={FLOOR - 2} strokeWidth={8} />
            <polyline points="130,358 196,262 214,318 278,342 280,358" strokeWidth={10} />
            <polyline points="214,318 252,224 258,210" strokeWidth={10} />
            <line x1={186} y1={250} x2={197} y2={264} strokeWidth={7} />
            <line x1={244} y1={208} x2={274} y2={205} strokeWidth={8} />
          </g>
          <Spokes cx={268} cy={312} r={30} set={set} />
          <rect x={164} y={241} width={42} height={9} rx={4.5} fill={FILL_HI} />
          <g opacity={0.5}>
            <line ref={set('cFar')} stroke={FRAME} strokeWidth={6} />
            <g ref={set('pFar')}>
              <rect width={20} height={5} rx={2.5} fill={FILL_HI} />
            </g>
          </g>
          <circle cx={BIKE_CRANK.x} cy={BIKE_CRANK.y} r={7} fill={FILL_HI} />
        </g>
      )
    case 'rower':
      return (
        <g>
          <Floor />
          <g stroke={FRAME} fill="none">
            <line x1={90} y1={342} x2={322} y2={342} strokeWidth={8} />
            <line x1={98} y1={342} x2={98} y2={FLOOR} strokeWidth={7} />
            <line x1={80} y1={FLOOR} x2={116} y2={FLOOR} strokeWidth={6} />
            <line x1={330} y1={FLOOR} x2={378} y2={FLOOR} strokeWidth={7} />
          </g>
          <Spokes cx={352} cy={312} r={30} set={set} />
          <polygon points="270,346 292,346 304,306 288,302" fill={FILL_HI} />
          <g ref={set('seat')}>
            <rect x={0} y={334} width={44} height={9} rx={4} fill={FILL_HI} />
          </g>
        </g>
      )
  }
}

/** Equipment in front of the body: the near pedal, handle and crank. */
function PropFront({ kind, set }: { kind: PropKind; set: SetRef }) {
  switch (kind) {
    case 'elliptical':
      return (
        <g>
          <polyline ref={set('aNear')} fill="none" stroke="rgb(234 242 247 / 0.32)" strokeWidth={7} />
          <g ref={set('pNear')}>
            <rect width={42} height={7} rx={3} fill="var(--surface-7, #38383e)" />
          </g>
          <line ref={set('hNear')} stroke="rgb(234 242 247 / 0.55)" strokeWidth={8} />
        </g>
      )
    case 'bike':
      return (
        <g>
          <line ref={set('cNear')} stroke="rgb(234 242 247 / 0.45)" strokeWidth={7} />
          <g ref={set('pNear')}>
            <rect width={20} height={5} rx={2.5} fill="var(--brand)" />
          </g>
        </g>
      )
    case 'rower':
      return (
        <g>
          <line ref={set('chain')} x1={ROWER_EXIT.x} y1={ROWER_EXIT.y} stroke="rgb(234 242 247 / 0.45)" strokeWidth={3} />
          <circle ref={set('grip')} r={6} fill="var(--brand)" />
        </g>
      )
    default:
      return null
  }
}
