import { geoEqualEarth, geoMercator, geoPath } from 'd3-geo'
import { useMemo, useState } from 'react'
import {
  DISTORTION_PAIRS,
  featureCollection,
  highlightFeatures,
  MAP_DATA_RESOLUTION,
  type DistortionPair,
} from './worldLand'

export type MapViewMode = 'mercator' | 'actual' | 'side' | 'wipe'

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
    const merc = geoMercator().fitExtent(
      [
        [24, 24],
        [W - 24, H - 24],
      ],
      landFc,
    )
    const equal = geoEqualEarth().fitExtent(
      [
        [24, 24],
        [W - 24, H - 24],
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

    // Only draw highlight overlays for the active pair (keeps SVG lean on phones).
    const activeOverlays = overlays.filter((o) => o.highlight)

    return { lands, overlays: activeOverlays }
  }, [highlight])
}

function MapSvg({
  kind,
  lands,
  overlays,
  title,
}: {
  kind: 'mercator' | 'equal'
  lands: ProjectedLand[]
  overlays: ProjectedLand[]
  title: string
}) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="map-svg" role="img" aria-label={title || 'World map'}>
      <rect x="0" y="0" width={W} height={H} className="map-ocean" rx="28" />
      {lands.map((land) => (
        <path
          key={`${kind}-land-${land.id}`}
          d={kind === 'mercator' ? land.mercD : land.equalD}
          className="map-land"
        />
      ))}
      {overlays.map((land) => (
        <path
          key={`${kind}-hl-${land.id}`}
          d={kind === 'mercator' ? land.mercD : land.equalD}
          className={`map-land hl-${land.highlight}`}
        />
      ))}
      {title ? (
        <text x="28" y="42" className="map-label">
          {title}
        </text>
      ) : null}
    </svg>
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

export default function MapSizeCompare({ onBack }: Props) {
  const [view, setView] = useState<MapViewMode>('wipe')
  const [wipe, setWipe] = useState(55)
  const [pairId, setPairId] = useState(DISTORTION_PAIRS[0]!.id)

  const pair = DISTORTION_PAIRS.find((p) => p.id === pairId) ?? DISTORTION_PAIRS[0]!
  const { lands, overlays } = useProjectedPaths(pair)

  const reset = () => {
    setView('wipe')
    setWipe(55)
    setPairId(DISTORTION_PAIRS[0]!.id)
  }

  return (
    <>
      <TopBarLocal onBack={onBack} />
      <h2 className="screen-title">Map Size Compare</h2>
      <p className="screen-sub">Mercator stretches the poles. Peek at real sizes!</p>

      <div className="map-seg" role="group" aria-label="Map view">
        {(
          [
            { id: 'mercator', label: 'Mercator' },
            { id: 'actual', label: 'Actual size' },
            { id: 'side', label: 'Side-by-side' },
            { id: 'wipe', label: 'Wipe' },
          ] as const
        ).map((opt) => (
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
          <MapSvg kind="mercator" lands={lands} overlays={overlays} title="Mercator (stretched)" />
        )}
        {view === 'actual' && (
          <MapSvg kind="equal" lands={lands} overlays={overlays} title="Actual size (equal area)" />
        )}
        {view === 'side' && (
          <div className="map-side">
            <MapSvg kind="mercator" lands={lands} overlays={overlays} title="Mercator" />
            <MapSvg kind="equal" lands={lands} overlays={overlays} title="Actual size" />
          </div>
        )}
        {view === 'wipe' && (
          <div className="map-wipe-wrap">
            <div className="map-wipe-base">
              <MapSvg kind="equal" lands={lands} overlays={overlays} title="Actual size ← → Mercator" />
            </div>
            <div className="map-wipe-top" style={{ width: `${wipe}%` }}>
              <div className="map-wipe-inner" style={{ width: `${(100 / Math.max(wipe, 1)) * 100}%` }}>
                <MapSvg kind="mercator" lands={lands} overlays={overlays} title="" />
              </div>
            </div>
            <div className="map-wipe-handle" style={{ left: `${wipe}%` }} aria-hidden>
              <span />
            </div>
            <label className="map-wipe-slider">
              <span className="sr-only">Reveal Mercator vs actual</span>
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
