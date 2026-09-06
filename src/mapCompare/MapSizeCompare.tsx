import { geoEqualEarth, geoMercator, geoOrthographic, geoPath } from 'd3-geo'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  DISTORTION_PAIRS,
  classroomFitFeature,
  featureCollection,
  highlightFeatures,
  MAP_DATA_RESOLUTION,
  type DistortionPair,
} from './worldLand'

export type MapViewMode = 'mercator' | 'equal' | 'globe' | 'side' | 'wipe'

type Props = {
  onBack: () => void
}

const W = 960
const H = 480

type ProjectedLand = {
  id: string
  mercD: string
  equalD: string
  highlight: 'a' | 'b' | null
  kind: 'land' | 'highlight'
}

function useProjectedPaths(highlight: DistortionPair | null) {
  return useMemo(() => {
    const landFc = featureCollection()
    // Mercator: fit classroom latitudes (exclude Antarctica) so the familiar
    // world fills the frame; clipExtent crops polar overflow.
    const merc = geoMercator()
      .fitExtent(
        [
          [12, 18],
          [W - 12, H - 18],
        ],
        classroomFitFeature(),
      )
      .clipExtent([
        [0, 0],
        [W, H],
      ])
    // Equal Earth: full world, tight in the viewBox
    const equal = geoEqualEarth().fitExtent(
      [
        [12, 18],
        [W - 12, H - 18],
      ],
      landFc,
    )
    const mercPath = geoPath(merc)
    const equalPath = geoPath(equal)

    const lands: ProjectedLand[] = landFc.features.map((f, i) => {
      const id = String(f.id ?? f.properties.id ?? `land-${i}`)
      return {
        id,
        mercD: mercPath(f) ?? '',
        equalD: equalPath(f) ?? '',
        highlight: null,
        kind: 'land' as const,
      }
    })

    const overlays: ProjectedLand[] = highlightFeatures().map((f) => {
      const id = String(f.id ?? f.properties.id)
      const isA = highlight?.aId === id
      const isB = highlight?.bId === id
      return {
        id,
        mercD: mercPath(f) ?? '',
        equalD: equalPath(f) ?? '',
        highlight: isA ? ('a' as const) : isB ? ('b' as const) : null,
        kind: 'highlight' as const,
      }
    })

    const activeOverlays = overlays.filter((o) => o.highlight)

    return { lands, overlays: activeOverlays }
  }, [highlight])
}

function MapSvg({
  kind,
  lands,
  overlays,
  title,
  paintId,
}: {
  kind: 'mercator' | 'equal'
  lands: ProjectedLand[]
  overlays: ProjectedLand[]
  title: string
  paintId: string
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="map-svg"
      role="img"
      aria-label={title || 'World map'}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id={`${paintId}-ocean`} cx="42%" cy="36%" r="78%">
          <stop offset="0%" stopColor="#6ec4ef" />
          <stop offset="42%" stopColor="#2f8fc9" />
          <stop offset="78%" stopColor="#156089" />
          <stop offset="100%" stopColor="#0a3554" />
        </radialGradient>
        <radialGradient id={`${paintId}-ocean-vignette`} cx="50%" cy="50%" r="72%">
          <stop offset="55%" stopColor="rgba(4, 28, 48, 0)" />
          <stop offset="100%" stopColor="rgba(4, 28, 48, 0.4)" />
        </radialGradient>
        <linearGradient id={`${paintId}-land`} x1="8%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%" stopColor="#d2e09a" />
          <stop offset="28%" stopColor="#8fbc6e" />
          <stop offset="58%" stopColor="#c4a86e" />
          <stop offset="100%" stopColor="#6f9a52" />
        </linearGradient>
        <pattern id={`${paintId}-land-tex`} width="90" height="90" patternUnits="userSpaceOnUse">
          <rect width="90" height="90" fill={`url(#${paintId}-land)`} />
          <circle cx="22" cy="26" r="20" fill="#e0cfa0" opacity="0.2" />
          <circle cx="64" cy="58" r="24" fill="#5f8f45" opacity="0.16" />
          <circle cx="48" cy="16" r="14" fill="#f0e4b8" opacity="0.12" />
          <circle cx="12" cy="68" r="16" fill="#4e7a3c" opacity="0.1" />
        </pattern>
        <filter id={`${paintId}-land-shadow`} x="-6%" y="-6%" width="112%" height="112%">
          <feDropShadow dx="0" dy="1.1" stdDeviation="1.5" floodColor="#082418" floodOpacity="0.42" />
        </filter>
        <filter id={`${paintId}-hl-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#fff4c8" floodOpacity="0.9" />
        </filter>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill={`url(#${paintId}-ocean)`} rx="28" />
      <rect
        x="0"
        y="0"
        width={W}
        height={H}
        fill={`url(#${paintId}-ocean-vignette)`}
        rx="28"
        className="map-ocean-vignette"
      />
      <g filter={`url(#${paintId}-land-shadow)`} className="map-land-layer">
        {lands.map((land) => (
          <path
            key={`${kind}-land-${land.id}`}
            d={kind === 'mercator' ? land.mercD : land.equalD}
            className="map-land"
            fill={`url(#${paintId}-land-tex)`}
          />
        ))}
      </g>
      <g filter={`url(#${paintId}-hl-glow)`} className="map-hl-layer">
        {overlays.map((land) => (
          <path
            key={`${kind}-hl-${land.id}`}
            d={kind === 'mercator' ? land.mercD : land.equalD}
            className={`map-land hl-${land.highlight}`}
          />
        ))}
      </g>
      {title ? (
        <text x="28" y="42" className="map-label">
          {title}
        </text>
      ) : null}
    </svg>
  )
}

type Rotation = [number, number, number]

function GlobeSvg({ highlight }: { highlight: DistortionPair }) {
  const [rotation, setRotation] = useState<Rotation>([-20, -20, 0])
  const dragRef = useRef<{
    pointerId: number
    x: number
    y: number
    rotation: Rotation
  } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { lands, overlays, sphereD, sphereCx, sphereCy, sphereR } = useMemo(() => {
    const landFc = featureCollection()
    const projection = geoOrthographic()
      .rotate(rotation)
      .fitExtent(
        [
          [36, 36],
          [W - 36, H - 36],
        ],
        { type: 'Sphere' },
      )
      .clipAngle(90)

    const path = geoPath(projection)
    const lands = landFc.features.map((f, i) => {
      const id = String(f.id ?? f.properties.id ?? `land-${i}`)
      return { id, d: path(f) ?? '' }
    })

    const overlays = highlightFeatures()
      .map((f) => {
        const id = String(f.id ?? f.properties.id)
        const isA = highlight.aId === id
        const isB = highlight.bId === id
        return {
          id,
          d: path(f) ?? '',
          highlight: isA ? ('a' as const) : isB ? ('b' as const) : null,
        }
      })
      .filter((o) => o.highlight)

    const [[x0, y0], [x1, y1]] = path.bounds({ type: 'Sphere' })
    const sphereCx = (x0 + x1) / 2
    const sphereCy = (y0 + y1) / 2
    const sphereR = Math.max((x1 - x0) / 2, (y1 - y0) / 2)

    return {
      lands,
      overlays,
      sphereD: path({ type: 'Sphere' }) ?? '',
      sphereCx,
      sphereCy,
      sphereR,
    }
  }, [rotation, highlight])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      dragRef.current = {
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        rotation: [...rotation] as Rotation,
      }
    },
    [rotation],
  )

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    const width = wrapRef.current?.clientWidth || 320
    const k = 180 / Math.max(width, 160)
    const next: Rotation = [
      drag.rotation[0] + dx * k,
      Math.max(-80, Math.min(80, drag.rotation[1] - dy * k)),
      drag.rotation[2],
    ]
    setRotation(next)
  }, [])

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null
    }
  }, [])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      if (!dragRef.current) {
        setRotation((r) => [r[0] + dt * 0.008, r[1], r[2]])
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const paintId = 'globe'
  const lightX = sphereCx - sphereR * 0.32
  const lightY = sphereCy - sphereR * 0.36

  return (
    <div
      ref={wrapRef}
      className="map-globe-wrap"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="img"
      aria-label="Globe — drag to spin"
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="map-svg map-globe-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id={`${paintId}-bg`} cx="50%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#1a4a6e" />
            <stop offset="100%" stopColor="#071828" />
          </radialGradient>
          <radialGradient id={`${paintId}-sphere-ocean`} cx="34%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#9ad8f6" />
            <stop offset="32%" stopColor="#3aa0d4" />
            <stop offset="68%" stopColor="#1a6fa8" />
            <stop offset="100%" stopColor="#0b3a62" />
          </radialGradient>
          <radialGradient id={`${paintId}-sphere-shade`} cx="32%" cy="28%" r="78%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="36%" stopColor="rgba(255, 255, 255, 0.05)" />
            <stop offset="58%" stopColor="rgba(0, 14, 30, 0.15)" />
            <stop offset="100%" stopColor="rgba(0, 8, 20, 0.58)" />
          </radialGradient>
          <radialGradient id={`${paintId}-sphere-spec`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.75)" />
            <stop offset="40%" stopColor="rgba(255, 255, 255, 0.2)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </radialGradient>
          <linearGradient id={`${paintId}-land`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#d4e4a0" />
            <stop offset="35%" stopColor="#8fbc6e" />
            <stop offset="70%" stopColor="#c2a66c" />
            <stop offset="100%" stopColor="#6d984f" />
          </linearGradient>
          <pattern id={`${paintId}-land-tex`} width="80" height="80" patternUnits="userSpaceOnUse">
            <rect width="80" height="80" fill={`url(#${paintId}-land)`} />
            <circle cx="20" cy="24" r="18" fill="#e2d09a" opacity="0.2" />
            <circle cx="56" cy="52" r="22" fill="#5d8c44" opacity="0.16" />
          </pattern>
          <filter id={`${paintId}-land-shadow`} x="-8%" y="-8%" width="116%" height="116%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#041820" floodOpacity="0.35" />
          </filter>
          <filter id={`${paintId}-hl-glow`} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#fff4c8" floodOpacity="0.85" />
          </filter>
          <filter id={`${paintId}-sphere-soft`} x="-12%" y="-12%" width="124%" height="124%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000814" floodOpacity="0.45" />
          </filter>
          <clipPath id={`${paintId}-clip`}>
            <path d={sphereD} />
          </clipPath>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill={`url(#${paintId}-bg)`} rx="28" className="map-globe-bg" />

        <g filter={`url(#${paintId}-sphere-soft)`}>
          <path d={sphereD} fill={`url(#${paintId}-sphere-ocean)`} className="map-sphere" />
        </g>

        <g clipPath={`url(#${paintId}-clip)`}>
          <g filter={`url(#${paintId}-land-shadow)`}>
            {lands.map((land) =>
              land.d ? (
                <path
                  key={`globe-land-${land.id}`}
                  d={land.d}
                  className="map-land map-land-globe"
                  fill={`url(#${paintId}-land-tex)`}
                />
              ) : null,
            )}
          </g>
          <g filter={`url(#${paintId}-hl-glow)`}>
            {overlays.map((land) =>
              land.d ? (
                <path
                  key={`globe-hl-${land.id}`}
                  d={land.d}
                  className={`map-land hl-${land.highlight}`}
                />
              ) : null,
            )}
          </g>
          {/* Atmosphere / night-side darkening + day highlight */}
          <path d={sphereD} fill={`url(#${paintId}-sphere-shade)`} className="map-sphere-shade" />
          <ellipse
            cx={lightX}
            cy={lightY}
            rx={sphereR * 0.28}
            ry={sphereR * 0.18}
            fill={`url(#${paintId}-sphere-spec)`}
            className="map-sphere-spec"
            pointerEvents="none"
          />
        </g>

        {/* Thin rim so the sphere reads as a ball */}
        <path d={sphereD} className="map-sphere-rim" fill="none" />

        <text x="28" y="42" className="map-label map-label-globe">
          Globe
        </text>
      </svg>
      <p className="map-globe-hint">👆 Drag to spin the Earth!</p>
    </div>
  )
}

function TopBarLocal({ onBack }: { onBack: () => void }) {
  return (
    <header className="topbar">
      <button type="button" className="back-btn" onClick={onBack} aria-label="Go back">
        ←
      </button>
      <div className="brand">
        <div className="brand-mark" aria-hidden>
          🗺️
        </div>
        <div>
          <h1>Noah Tools</h1>
          <p>Map Size Compare</p>
        </div>
      </div>
    </header>
  )
}

const VIEW_OPTIONS = [
  { id: 'mercator', label: 'Mercator' },
  { id: 'equal', label: 'Equal Earth' },
  { id: 'globe', label: 'Globe' },
  { id: 'side', label: 'Side-by-side' },
  { id: 'wipe', label: 'Wipe' },
] as const

export default function MapSizeCompare({ onBack }: Props) {
  const [view, setView] = useState<MapViewMode>('side')
  const [wipe, setWipe] = useState(55)
  const [pairId, setPairId] = useState(DISTORTION_PAIRS[0]!.id)

  const pair = DISTORTION_PAIRS.find((p) => p.id === pairId) ?? DISTORTION_PAIRS[0]!
  const { lands, overlays } = useProjectedPaths(pair)

  const reset = () => {
    setView('side')
    setWipe(55)
    setPairId(DISTORTION_PAIRS[0]!.id)
  }

  return (
    <>
      <TopBarLocal onBack={onBack} />
      <h2 className="screen-title">Map Size Compare</h2>
      <p className="screen-sub map-screen-sub">Mercator stretches the poles. Peek at real sizes!</p>

      <div className="map-seg" role="group" aria-label="Map view">
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`map-seg-btn ${view === opt.id ? 'active' : ''}`}
            onClick={() => setView(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="map-stage">
        {view === 'mercator' && (
          <MapSvg
            kind="mercator"
            lands={lands}
            overlays={overlays}
            title="Mercator (stretched)"
            paintId="merc"
          />
        )}
        {view === 'equal' && (
          <MapSvg
            kind="equal"
            lands={lands}
            overlays={overlays}
            title="Equal Earth (true size)"
            paintId="eq"
          />
        )}
        {view === 'globe' && <GlobeSvg highlight={pair} />}
        {view === 'side' && (
          <div className="map-side">
            <MapSvg kind="mercator" lands={lands} overlays={overlays} title="Mercator" paintId="side-m" />
            <MapSvg kind="equal" lands={lands} overlays={overlays} title="Equal Earth" paintId="side-e" />
          </div>
        )}
        {view === 'wipe' && (
          <div className="map-wipe-wrap">
            <div className="map-wipe-frame">
              <div className="map-wipe-base">
                <MapSvg
                  kind="equal"
                  lands={lands}
                  overlays={overlays}
                  title="Equal Earth ← → Mercator"
                  paintId="wipe-eq"
                />
              </div>
              <div className="map-wipe-top" style={{ width: `${wipe}%` }}>
                <div className="map-wipe-inner" style={{ width: `${(100 / Math.max(wipe, 1)) * 100}%` }}>
                  <MapSvg kind="mercator" lands={lands} overlays={overlays} title="" paintId="wipe-m" />
                </div>
              </div>
              <div className="map-wipe-handle" style={{ left: `${wipe}%` }} aria-hidden>
                <span />
              </div>
            </div>
            <label className="map-wipe-slider">
              <span className="sr-only">Reveal Mercator vs Equal Earth</span>
              <input
                type="range"
                min={8}
                max={92}
                value={wipe}
                onChange={(e) => setWipe(Number(e.target.value))}
              />
            </label>
          </div>
        )}
      </div>

      {view === 'side' ? (
        <p className="map-kid-line" role="note">
          Top stretches the poles · Bottom is true size
        </p>
      ) : null}

      <div className="map-pairs" role="group" aria-label="Highlight distortion pairs">
        {DISTORTION_PAIRS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`map-pair-btn ${pairId === p.id ? 'active' : ''}`}
            onClick={() => setPairId(p.id)}
          >
            <span aria-hidden>{p.emoji}</span>
            <strong>{p.label}</strong>
          </button>
        ))}
      </div>

      <div className="map-callout" role="status">
        <div className="map-callout-title">How stretched?</div>
        <p>{pair.stretchNote}</p>
        <p className="map-kid-tip">💡 {pair.tip}</p>
      </div>

      <div className="actions">
        <button type="button" className="btn secondary" onClick={reset}>
          Reset
        </button>
        <button type="button" className="btn ghost" onClick={onBack}>
          Back to tools
        </button>
      </div>
      <p className="footnote">
        Real Natural Earth {MAP_DATA_RESOLUTION} coastlines — for play, not navigation.
      </p>
    </>
  )
}
