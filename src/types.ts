export type BodyPart = 'tummy' | 'teeth'
export type ScanMode = 'before-potty' | 'after-potty' | 'before-brushing' | 'after-brushing'

export type Screen =
  | { name: 'home' }
  | { name: 'part' }
  | { name: 'mode'; part: BodyPart }
  | { name: 'scan'; part: BodyPart; mode: ScanMode }
  | { name: 'result'; part: BodyPart; mode: ScanMode; germPercent: number; isClean: boolean }

export type ToolCard = {
  id: string
  title: string
  emoji: string
  blurb: string
  status: 'live' | 'soon'
}
