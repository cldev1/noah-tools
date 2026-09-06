/** Simplified public-domain-style land outlines (approx lon/lat rings). Kid-friendly, not cartographic survey data. */
export type LonLat = [number, number]

export type LandFeature = {
  id: string
  name: string
  /** Exterior ring, lon/lat, closed optional */
  rings: LonLat[][]
}

/** Very simplified continents for Mercator vs Equal Earth compare. */
export const WORLD_LAND: LandFeature[] = [
  {
    id: 'greenland',
    name: 'Greenland',
    rings: [[
      [-73, 78], [-60, 82], [-40, 83], [-20, 81], [-15, 75], [-20, 70],
      [-30, 68], [-40, 65], [-45, 60], [-50, 60], [-55, 65], [-65, 70],
      [-70, 75], [-73, 78],
    ]],
  },
  {
    id: 'africa',
    name: 'Africa',
    rings: [[
      [-17, 35], [-10, 36], [0, 37], [10, 37], [20, 32], [32, 31],
      [35, 28], [40, 15], [43, 12], [51, 12], [43, 0], [40, -5],
      [42, -15], [35, -25], [32, -30], [25, -34], [18, -35], [12, -18],
      [12, 0], [8, 5], [0, 5], [-5, 5], [-10, 5], [-15, 10],
      [-17, 15], [-17, 25], [-17, 35],
    ]],
  },
  {
    id: 'namerica',
    name: 'North America',
    rings: [[
      [-168, 65], [-140, 70], [-120, 72], [-90, 72], [-70, 65], [-60, 55],
      [-55, 50], [-65, 45], [-75, 40], [-80, 30], [-85, 25], [-95, 22],
      [-105, 22], [-110, 25], [-115, 32], [-120, 35], [-125, 45], [-130, 55],
      [-140, 60], [-155, 60], [-168, 65],
    ]],
  },
  {
    id: 'alaska',
    name: 'Alaska',
    rings: [[
      [-170, 55], [-160, 58], [-150, 62], [-140, 65], [-135, 60], [-140, 55],
      [-150, 55], [-160, 55], [-170, 55],
    ]],
  },
  {
    id: 'samerica',
    name: 'South America',
    rings: [[
      [-80, 12], [-70, 12], [-60, 5], [-50, 0], [-40, -5], [-35, -10],
      [-35, -20], [-40, -30], [-50, -35], [-55, -40], [-65, -45], [-70, -50],
      [-75, -45], [-75, -30], [-80, -20], [-80, -5], [-80, 12],
    ]],
  },
  {
    id: 'brazil',
    name: 'Brazil (highlight zone)',
    rings: [[
      [-70, 5], [-50, 5], [-40, 0], [-35, -10], [-40, -20], [-50, -25],
      [-60, -20], [-65, -10], [-70, 0], [-70, 5],
    ]],
  },
  {
    id: 'europe',
    name: 'Europe',
    rings: [[
      [-10, 36], [-5, 43], [0, 50], [5, 58], [10, 60], [20, 70],
      [30, 70], [40, 65], [40, 55], [30, 48], [25, 42], [20, 40],
      [10, 38], [0, 36], [-10, 36],
    ]],
  },
  {
    id: 'asia',
    name: 'Asia',
    rings: [[
      [40, 65], [50, 70], [70, 72], [90, 75], [110, 72], [130, 70],
      [140, 65], [145, 55], [140, 45], [130, 40], [120, 30], [110, 20],
      [100, 10], [105, 5], [100, 0], [95, 15], [90, 25], [80, 30],
      [70, 25], [60, 25], [50, 30], [45, 40], [40, 50], [40, 65],
    ]],
  },
  {
    id: 'australia',
    name: 'Australia',
    rings: [[
      [113, -22], [120, -15], [130, -12], [140, -15], [150, -20], [153, -30],
      [145, -38], [135, -35], [125, -32], [115, -35], [113, -22],
    ]],
  },
  {
    id: 'antarctica',
    name: 'Antarctica',
    rings: [[
      [-180, -72], [-120, -75], [-60, -72], [0, -70], [60, -72], [120, -75],
      [180, -72], [180, -85], [-180, -85], [-180, -72],
    ]],
  },
]

/** Distortion highlight pairs for the kid callouts. */
export type DistortionPair = {
  id: string
  label: string
  emoji: string
  aId: string
  bId: string
  tip: string
  stretchNote: string
}

export const DISTORTION_PAIRS: DistortionPair[] = [
  {
    id: 'greenland-africa',
    label: 'Greenland vs Africa',
    emoji: '🧊🌍',
    aId: 'greenland',
    bId: 'africa',
    tip: 'Greenland looks huge on Mercator but isn’t!',
    stretchNote: 'Near the poles, Mercator stretches land a lot. Greenland looks almost as big as Africa — but Africa is about 14× bigger!',
  },
  {
    id: 'alaska-brazil',
    label: 'Alaska vs Brazil',
    emoji: '❄️🌴',
    aId: 'alaska',
    bId: 'brazil',
    tip: 'Alaska looks bigger up high on Mercator!',
    stretchNote: 'Alaska sits far north, so Mercator puffs it up. Brazil is closer to the equator and stays closer to its real size.',
  },
  {
    id: 'europe-samerica',
    label: 'Europe vs S. America',
    emoji: '🏰🦙',
    aId: 'europe',
    bId: 'samerica',
    tip: 'Europe looks bigger than it really is!',
    stretchNote: 'Europe sits farther from the equator than much of South America, so Mercator makes Europe look oversized.',
  },
]

export function featureCollection() {
  return {
    type: 'FeatureCollection' as const,
    features: WORLD_LAND.map((f) => ({
      type: 'Feature' as const,
      id: f.id,
      properties: { name: f.name, id: f.id },
      geometry: {
        type: 'Polygon' as const,
        coordinates: f.rings.map((ring) => {
          const closed = [...ring]
          const first = closed[0]
          const last = closed[closed.length - 1]
          if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
            closed.push(first)
          }
          return closed
        }),
      },
    })),
  }
}
