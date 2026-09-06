/**
 * Build compact Natural Earth 110m land + highlight GeoJSON for Map Size Compare.
 * Source: https://github.com/nvkelso/natural-earth-vector (public domain)
 *
 * Usage:
 *   curl -fsSL -o /tmp/ne/countries.geojson \
 *     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
 *   curl -fsSL -o /tmp/ne/land.geojson \
 *     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson
 *   node scripts/build-map-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const countries = JSON.parse(readFileSync('/tmp/ne/countries.geojson', 'utf8'))
const landSrc = JSON.parse(readFileSync('/tmp/ne/land.geojson', 'utf8'))

function polysFromFeature(f) {
  if (!f?.geometry) return []
  if (f.geometry.type === 'Polygon') return [f.geometry.coordinates]
  if (f.geometry.type === 'MultiPolygon') return f.geometry.coordinates
  return []
}

function featureFromPolys(id, name, polys) {
  if (polys.length === 0) throw new Error(`No polygons for ${id}`)
  if (polys.length === 1) {
    return {
      type: 'Feature',
      id,
      properties: { name, id, kind: 'highlight' },
      geometry: { type: 'Polygon', coordinates: polys[0] },
    }
  }
  return {
    type: 'Feature',
    id,
    properties: { name, id, kind: 'highlight' },
    geometry: { type: 'MultiPolygon', coordinates: polys },
  }
}

const byContinent = (name) =>
  countries.features.filter((f) => f.properties.CONTINENT === name)
const byIso = (iso) => countries.features.find((f) => f.properties.ISO_A3 === iso)

const europePolys = byContinent('Europe')
  .filter((f) => f.properties.ISO_A3 !== 'RUS')
  .flatMap(polysFromFeature)
const africaPolys = byContinent('Africa').flatMap(polysFromFeature)
const samericaPolys = byContinent('South America').flatMap(polysFromFeature)

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
  featureFromPolys('greenland', 'Greenland', polysFromFeature(greenland)),
  featureFromPolys('africa', 'Africa', africaPolys),
  featureFromPolys('alaska', 'Alaska', alaskaPolys),
  featureFromPolys('brazil', 'Brazil', polysFromFeature(brazil)),
  featureFromPolys('europe', 'Europe', europePolys),
  featureFromPolys('samerica', 'South America', samericaPolys),
]

const land = {
  type: 'FeatureCollection',
  features: landSrc.features.map((f, i) => ({
    type: 'Feature',
    id: `land-${i}`,
    properties: { name: 'Land', id: `land-${i}`, kind: 'land' },
    geometry: f.geometry,
  })),
}

const out = {
  attribution: 'Natural Earth 110m (public domain) — https://www.naturalearthdata.com/',
  resolution: '110m',
  land,
  highlights: { type: 'FeatureCollection', features: highlights },
}

const outPath = join(root, 'src/mapCompare/data/ne110m.json')
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(out))
console.log('Wrote', outPath, Buffer.byteLength(JSON.stringify(out)), 'bytes')
for (const h of highlights) {
  const n = h.geometry.type === 'MultiPolygon' ? h.geometry.coordinates.length : 1
  console.log(' ', h.id, h.geometry.type, 'parts=', n)
}
