/**
 * Build compact Natural Earth 50m land + highlight GeoJSON for Map Size Compare.
 * Source: https://github.com/nvkelso/natural-earth-vector (public domain)
 *
 * Simplifies with Douglas–Peucker so the Pages JS bundle stays mobile-friendly
 * while coasts stay clearly sharper than 110m.
 *
 * Usage:
 *   mkdir -p /tmp/ne
 *   curl -fsSL -o /tmp/ne/countries.geojson \
 *     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
 *   curl -fsSL -o /tmp/ne/land.geojson \
 *     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson
 *   node scripts/build-map-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const countries = JSON.parse(readFileSync('/tmp/ne/countries.geojson', 'utf8'))
const landSrc = JSON.parse(readFileSync('/tmp/ne/land.geojson', 'utf8'))

/** ~0.1° ≈ 11 km — keeps 50m character without a huge bundle. */
const TOL = 0.1
/** Drop tiny islets that clutter a kid map and bloat the file. */
const MIN_AREA = 0.025

function sqSegDist(p, p1, p2) {
  let x = p1[0]
  let y = p1[1]
  let dx = p2[0] - x
  let dy = p2[1] - y
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)
    if (t > 1) {
      x = p2[0]
      y = p2[1]
    } else if (t > 0) {
      x += dx * t
      y += dy * t
    }
  }
  dx = p[0] - x
  dy = p[1] - y
  return dx * dx + dy * dy
}

function simplifyRing(points, sqTol) {
  const n = points.length
  if (n <= 4) {
    return points.map((p) => [+p[0].toFixed(3), +p[1].toFixed(3)])
  }
  const markers = new Uint8Array(n)
  markers[0] = 1
  markers[n - 1] = 1
  const stack = [[0, n - 1]]
  while (stack.length) {
    const [first, last] = stack.pop()
    let maxSq = 0
    let index = -1
    for (let i = first + 1; i < last; i++) {
      const d = sqSegDist(points[i], points[first], points[last])
      if (d > maxSq) {
        index = i
        maxSq = d
      }
    }
    if (maxSq > sqTol && index >= 0) {
      markers[index] = 1
      if (index - first > 1) stack.push([first, index])
      if (last - index > 1) stack.push([index, last])
    }
  }
  const out = []
  for (let i = 0; i < n; i++) {
    if (markers[i]) out.push([+points[i][0].toFixed(3), +points[i][1].toFixed(3)])
  }
  if (out.length < 4) {
    return points.map((p) => [+p[0].toFixed(3), +p[1].toFixed(3)])
  }
  const a = out[0]
  const b = out[out.length - 1]
  if (a[0] !== b[0] || a[1] !== b[1]) out.push([...a])
  return out
}

function ringArea(ring) {
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
  }
  return Math.abs(a / 2)
}

function simplifyPolygon(poly, sqTol, minArea) {
  const outer = simplifyRing(poly[0], sqTol)
  if (ringArea(outer) < minArea) return null
  const holes = []
  for (let i = 1; i < poly.length; i++) {
    const h = simplifyRing(poly[i], sqTol)
    if (ringArea(h) >= minArea * 0.15) holes.push(h)
  }
  return [outer, ...holes]
}

function simplifyGeom(geom, tol, minArea) {
  const sqTol = tol * tol
  if (geom.type === 'Polygon') {
    const p = simplifyPolygon(geom.coordinates, sqTol, minArea)
    return p ? { type: 'Polygon', coordinates: p } : null
  }
  const polys = []
  for (const poly of geom.coordinates) {
    const p = simplifyPolygon(poly, sqTol, minArea)
    if (p) polys.push(p)
  }
  if (!polys.length) return null
  if (polys.length === 1) return { type: 'Polygon', coordinates: polys[0] }
  return { type: 'MultiPolygon', coordinates: polys }
}

function collectPolys(features) {
  const polys = []
  for (const f of features) {
    if (!f?.geometry) continue
    if (f.geometry.type === 'Polygon') polys.push(f.geometry.coordinates)
    else if (f.geometry.type === 'MultiPolygon') polys.push(...f.geometry.coordinates)
  }
  return polys
}

function featureFromPolys(id, name, polys, tol, minArea) {
  const geometry = simplifyGeom({ type: 'MultiPolygon', coordinates: polys }, tol, minArea)
  if (!geometry) throw new Error(`No polygons for ${id}`)
  return {
    type: 'Feature',
    id,
    properties: { name, id, kind: 'highlight' },
    geometry,
  }
}

const byContinent = (name) =>
  countries.features.filter((f) => f.properties.CONTINENT === name)
const byIso = (iso) => countries.features.find((f) => f.properties.ISO_A3 === iso)

const europePolys = collectPolys(
  byContinent('Europe').filter((f) => f.properties.ISO_A3 !== 'RUS'),
)
const africaPolys = collectPolys(byContinent('Africa'))
const samericaPolys = collectPolys(byContinent('South America'))

const greenland = byIso('GRL')
const brazil = byIso('BRA')
const usa = byIso('USA')

const alaskaPolys = []
if (usa?.geometry?.type === 'MultiPolygon') {
  for (const poly of usa.geometry.coordinates) {
    let minX = Infinity
    for (const [x] of poly[0]) minX = Math.min(minX, x)
    if (minX < -129) alaskaPolys.push(poly)
  }
}

const highlights = [
  featureFromPolys('greenland', 'Greenland', collectPolys([greenland]), TOL, MIN_AREA * 0.5),
  featureFromPolys('africa', 'Africa', africaPolys, TOL, MIN_AREA * 0.5),
  featureFromPolys('alaska', 'Alaska', alaskaPolys, TOL, MIN_AREA * 0.3),
  featureFromPolys('brazil', 'Brazil', collectPolys([brazil]), TOL, MIN_AREA * 0.5),
  featureFromPolys('europe', 'Europe', europePolys, TOL, MIN_AREA * 0.5),
  featureFromPolys('samerica', 'South America', samericaPolys, TOL, MIN_AREA * 0.5),
]

const landGeom = simplifyGeom(
  { type: 'MultiPolygon', coordinates: collectPolys(landSrc.features) },
  TOL,
  MIN_AREA,
)
if (!landGeom) throw new Error('Land geometry empty after simplify')

const land = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'land-all',
      properties: { name: 'Land', id: 'land-all', kind: 'land' },
      geometry: landGeom,
    },
  ],
}

const out = {
  attribution: 'Natural Earth 50m (public domain) — https://www.naturalearthdata.com/',
  resolution: '50m',
  land,
  highlights: { type: 'FeatureCollection', features: highlights },
}

const outPath = join(root, 'src/mapCompare/data/ne50m.json')
mkdirSync(dirname(outPath), { recursive: true })
const json = JSON.stringify(out)
writeFileSync(outPath, json)
console.log('Wrote', outPath, Buffer.byteLength(json), 'bytes')
console.log(
  ' land',
  landGeom.type,
  'parts=',
  landGeom.type === 'MultiPolygon' ? landGeom.coordinates.length : 1,
)
for (const h of highlights) {
  const n = h.geometry.type === 'MultiPolygon' ? h.geometry.coordinates.length : 1
  console.log(' ', h.id, h.geometry.type, 'parts=', n)
}
