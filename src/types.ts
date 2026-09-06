export type BodyPart = 'tummy' | 'teeth'
export type ScanMode = 'before-potty' | 'after-potty' | 'before-brushing' | 'after-brushing'

export type ToolId = 'germ' | 'map' | 'wash' | 'bath' | 'potty'

export type Screen =
  | { name: 'home' }
  | { name: 'map' }
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
  id: ToolId
  title: string
  emoji: string
  blurb: string
  status: 'live' | 'soon'
}
