// In-memory store for real-time transcripts
// In production, you'd want to use a proper database or Redis

interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
  confidence?: number
  is_final: boolean
  start_time?: number
  end_time?: number
}

interface BotData {
  id: string
  status: string
  meeting_url: string
  platform?: string
  meeting_id?: string
}

interface BotSession {
  bot: BotData
  transcript: TranscriptEntry[]
  lastUpdated: Date
}

class TranscriptStore {
  private sessions: Map<string, BotSession> = new Map()

  // Get or create a session for a bot
  getSession(botId: string): BotSession | null {
    return this.sessions.get(botId) || null
  }

  // Initialize a new session
  initSession(botId: string, botData: BotData): void {
    this.sessions.set(botId, {
      bot: botData,
      transcript: [],
      lastUpdated: new Date(),
    })
  }

  // Update bot status
  updateBotStatus(botId: string, status: string): void {
    const session = this.sessions.get(botId)
    if (session) {
      session.bot.status = status
      session.lastUpdated = new Date()
    }
  }

  // Add transcript entry (partial or final)
  addTranscriptEntry(botId: string, entry: TranscriptEntry): void {
    const session = this.sessions.get(botId)
    if (session) {
      // If it's a partial transcript, replace the last partial entry
      if (!entry.is_final && session.transcript.length > 0) {
        const lastEntry = session.transcript[session.transcript.length - 1]
        if (!lastEntry.is_final) {
          session.transcript[session.transcript.length - 1] = entry
        } else {
          session.transcript.push(entry)
        }
      } else {
        session.transcript.push(entry)
      }
      session.lastUpdated = new Date()
    }
  }

  // Get all transcript entries for a bot
  getTranscript(botId: string): TranscriptEntry[] {
    const session = this.sessions.get(botId)
    return session ? session.transcript : []
  }

  // Clean up old sessions (call periodically)
  cleanup(maxAgeHours = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)
    for (const [botId, session] of this.sessions.entries()) {
      if (session.lastUpdated < cutoff) {
        this.sessions.delete(botId)
      }
    }
  }
}

// Export singleton instance
export const transcriptStore = new TranscriptStore()

// Clean up old sessions every hour
setInterval(() => {
  transcriptStore.cleanup()
}, 60 * 60 * 1000)
