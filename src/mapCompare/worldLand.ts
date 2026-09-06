/**
 * Natural Earth 50m land + highlight regions for Map Size Compare.
 * Geometry: public domain (Natural Earth). See data/ne50m.json attribution.
 * Source coasts are 50m, Douglas–Peucker–simplified for a mobile Pages bundle.
 */
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import ne50m from './data/ne50m.json'

export type DistortionPair = {
  id: string
  label: string
  emoji: string
  aId: string
  bId: string
  tip: string
  stretchNote: string
}

export const MAP_DATA_ATTRIBUTION = ne50m.attribution
export const MAP_DATA_RESOLUTION = ne50m.resolution

export const DISTORTION_PAIRS: DistortionPair[] = [
  {
    id: 'greenland-africa',
    label: 'Greenland vs Africa',
    emoji: '🧊🌍',
    aId: 'greenland',
    bId: 'africa',
    tip: 'Greenland looks huge on Mercator but isn’t!',
    stretchNote:
      'Near the poles, Mercator stretches land a lot. Greenland looks almost as big as Africa — but Africa is about 14× bigger!',
  },
  {
    id: 'alaska-brazil',
    label: 'Alaska vs Brazil',
    emoji: '❄️🌴',
    aId: 'alaska',
    bId: 'brazil',
    tip: 'Alaska looks bigger up high on Mercator!',
    stretchNote:
      'Alaska sits far north, so Mercator puffs it up. Brazil is closer to the equator and stays closer to its real size.',
  },
  {
    id: 'europe-samerica',
    label: 'Europe vs S. America',
    emoji: '🏰🦙',
    aId: 'europe',
    bId: 'samerica',
    tip: 'Europe looks bigger than it really is!',
    stretchNote:
      'Europe sits farther from the equator than much of South America, so Mercator makes Europe look oversized.',
  },
]

type MapProps = { name: string; id: string; kind: 'land' | 'highlight' }

export type MapFeature = Feature<Polygon | MultiPolygon, MapProps> & { id: string }

/** Base land polygons (Natural Earth 50m, simplified). */
export function landFeatureCollection(): FeatureCollection<Polygon | MultiPolygon, MapProps> {
  return ne50m.land as FeatureCollection<Polygon | MultiPolygon, MapProps>
}

/** Highlight region features (greenland, africa, alaska, brazil, europe, samerica). */
export function highlightFeatures(): MapFeature[] {
  return ne50m.highlights.features as MapFeature[]
}

/** Combined collection used to fit projections (land extent). */
export function featureCollection(): FeatureCollection<Polygon | MultiPolygon, MapProps> {
  return landFeatureCollection()
}
