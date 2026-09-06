import type { BodyPart, ScanMode } from './types'

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Playful pretend scan — not medical. Before modes tend higher; after tend clean/low. */
export function pretendScan(part: BodyPart, mode: ScanMode): { germPercent: number; isClean: boolean } {
  const before =
    mode === 'before-potty' || mode === 'before-brushing'

  let germPercent: number
  if (before) {
    germPercent = rand(55, 92)
  } else {
    // After: usually clean or much lower
    germPercent = Math.random() < 0.72 ? rand(0, 12) : rand(13, 28)
  }

  // Tiny living variance already baked in via rand
  const cleanThreshold = part === 'teeth' ? 15 : 18
  const isClean = germPercent <= cleanThreshold
  return { germPercent, isClean }
}

export function modeLabel(mode: ScanMode): string {
  switch (mode) {
    case 'before-potty':
      return 'Before potty'
    case 'after-potty':
      return 'After potty'
    case 'before-brushing':
      return 'Before brushing'
    case 'after-brushing':
      return 'After brushing'
  }
}

export function partLabel(part: BodyPart): string {
  return part === 'tummy' ? 'Tummy' : 'Teeth'
}
