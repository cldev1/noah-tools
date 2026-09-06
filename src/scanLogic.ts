import type { BodyPart, ScanMode } from './types'

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Playful pretend scan — not medical. Before: germs %; after: always fully clean. */
export function pretendScan(_part: BodyPart, mode: ScanMode): { germPercent: number; isClean: boolean } {
  const before = mode === 'before-potty' || mode === 'before-brushing'

  if (!before) {
    return { germPercent: 0, isClean: true }
  }

  return { germPercent: rand(55, 92), isClean: false }
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

/** How long the scan bar loops before showing a result (ms). */
export const SCAN_DURATION_MS = 4800
