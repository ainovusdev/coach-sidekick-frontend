export interface Bot {
  id: string
  status: string
  meeting_url: string
  platform?: string
  meeting_id?: string
}

export interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
  confidence: number
  is_final: boolean
  start_time?: number
  end_time?: number
}
