export type BodyPart = 'tummy' | 'teeth'
export type ScanMode = 'before-potty' | 'after-potty' | 'before-brushing' | 'after-brushing'

export type Screen =
  | { name: 'home' }
  | { name: 'part' }
  | { name: 'mode'; part: BodyPart }
  | { name: 'photo'; part: BodyPart; mode: ScanMode; photoUrl?: string | null }
  | { name: 'scan'; part: BodyPart; mode: ScanMode; photoUrl: string | null }
  | {
      name: 'result'
      part: BodyPart
      mode: ScanMode
      photoUrl: string | null
      germPercent: number
      isClean: boolean
    }

export type ToolCard = {
  id: string
  title: string
  emoji: string
  blurb: string
  status: 'live' | 'soon'
}
