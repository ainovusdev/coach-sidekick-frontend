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
  createdAt: Date
  webhookEvents: number // Track number of webhook events received
}

class TranscriptStore {
  private sessions: Map<string, BotSession> = new Map()

  // Get or create a session for a bot
  getSession(botId: string): BotSession | null {
    const session = this.sessions.get(botId)
    console.log(`[TranscriptStore] getSession(${botId}):`, !!session)
    if (session) {
      console.log(`[TranscriptStore] Session details:`, {
        transcriptLength: session.transcript.length,
        lastUpdated: session.lastUpdated,
        createdAt: session.createdAt,
        webhookEvents: session.webhookEvents,
        botStatus: session.bot.status,
      })
      console.log(
        `[TranscriptStore] Recent transcript entries:`,
        session.transcript.slice(-3), // Show last 3 entries
      )
    } else {
      console.log(`[TranscriptStore] No session found for bot ${botId}`)
      console.log(
        `[TranscriptStore] Available sessions:`,
        Array.from(this.sessions.keys()),
      )
    }
    return session || null
  }

  // Initialize a new session
  initSession(botId: string, botData: BotData): void {
    const existingSession = this.sessions.get(botId)
    console.log(
      `[TranscriptStore] initSession(${botId}): existing session exists:`,
      !!existingSession,
    )
    if (existingSession) {
      console.log(
        `[TranscriptStore] WARNING: Overwriting existing session with ${existingSession.transcript.length} entries!`,
      )
      console.log(`[TranscriptStore] Existing session data:`, {
        transcriptLength: existingSession.transcript.length,
        webhookEvents: existingSession.webhookEvents,
        createdAt: existingSession.createdAt,
        lastUpdated: existingSession.lastUpdated,
      })
    }

    const now = new Date()
    this.sessions.set(botId, {
      bot: botData,
      transcript: [],
      lastUpdated: now,
      createdAt: now,
      webhookEvents: 0,
    })

    console.log(`[TranscriptStore] Initialized new session for ${botId}`)
  }

  // Update bot status
  updateBotStatus(botId: string, status: string): void {
    const session = this.sessions.get(botId)
    if (session) {
      const oldStatus = session.bot.status
      session.bot.status = status
      session.lastUpdated = new Date()
      console.log(
        `[TranscriptStore] Updated bot ${botId} status: ${oldStatus} -> ${status}`,
      )
    } else {
      console.log(
        `[TranscriptStore] WARNING: Tried to update status for non-existent session ${botId}`,
      )
    }
  }

  // Add transcript entry (partial or final)
  addTranscriptEntry(botId: string, entry: TranscriptEntry): void {
    console.log(`[TranscriptStore] Adding entry for bot ${botId}:`, {
      text: entry.text.substring(0, 50) + (entry.text.length > 50 ? '...' : ''),
      speaker: entry.speaker,
      is_final: entry.is_final,
      confidence: entry.confidence,
    })

    let session = this.sessions.get(botId)
    console.log(`[TranscriptStore] Session exists for bot ${botId}:`, !!session)

    if (!session) {
      console.log(
        `[TranscriptStore] No session found, creating one for bot ${botId}`,
      )
      // Auto-initialize session if it doesn't exist
      this.initSession(botId, {
        id: botId,
        status: 'unknown',
        meeting_url: '#',
        platform: 'unknown',
        meeting_id: undefined,
      })
      session = this.sessions.get(botId)!
    }

    // Track webhook events
    session.webhookEvents++

    const oldLength = session.transcript.length

    // If it's a partial transcript, replace the last partial entry
    if (!entry.is_final && session.transcript.length > 0) {
      const lastEntry = session.transcript[session.transcript.length - 1]
      if (!lastEntry.is_final) {
        session.transcript[session.transcript.length - 1] = entry
        console.log(
          `[TranscriptStore] Replaced last partial entry for bot ${botId}`,
        )
      } else {
        session.transcript.push(entry)
        console.log(
          `[TranscriptStore] Added new partial entry for bot ${botId}`,
        )
      }
    } else {
      session.transcript.push(entry)
      console.log(
        `[TranscriptStore] Added new ${
          entry.is_final ? 'final' : 'partial'
        } entry for bot ${botId}`,
      )
    }

    session.lastUpdated = new Date()

    console.log(
      `[TranscriptStore] Session now has ${session.transcript.length} entries (was ${oldLength}), webhookEvents: ${session.webhookEvents}`,
    )
  }

  // Get all transcript entries for a bot
  getTranscript(botId: string): TranscriptEntry[] {
    const session = this.sessions.get(botId)
    const transcript = session ? session.transcript : []
    console.log(
      `[TranscriptStore] getTranscript(${botId}): returning ${transcript.length} entries`,
    )
    return transcript
  }

  // Debug: Get all session IDs
  getAllSessionIds(): string[] {
    const ids = Array.from(this.sessions.keys())
    console.log(
      `[TranscriptStore] getAllSessionIds(): ${ids.length} sessions`,
      ids,
    )
    return ids
  }

  // Debug: Get session info
  getSessionInfo(botId: string): any {
    const session = this.sessions.get(botId)
    if (!session) {
      console.log(
        `[TranscriptStore] getSessionInfo(${botId}): session not found`,
      )
      return null
    }

    const info = {
      botId: session.bot.id,
      status: session.bot.status,
      transcriptCount: session.transcript.length,
      lastUpdated: session.lastUpdated,
      createdAt: session.createdAt,
      webhookEvents: session.webhookEvents,
      platform: session.bot.platform,
      meeting_id: session.bot.meeting_id,
    }

    console.log(`[TranscriptStore] getSessionInfo(${botId}):`, info)
    return info
  }

  // Debug: Get all sessions info
  getAllSessionsInfo(): any {
    const info = Array.from(this.sessions.entries()).map(
      ([botId, session]) => ({
        botId,
        status: session.bot.status,
        transcriptCount: session.transcript.length,
        lastUpdated: session.lastUpdated,
        createdAt: session.createdAt,
        webhookEvents: session.webhookEvents,
        platform: session.bot.platform,
      }),
    )

    console.log(
      `[TranscriptStore] getAllSessionsInfo(): ${info.length} sessions`,
      info,
    )
    return info
  }

  // Clean up old sessions (call periodically)
  cleanup(maxAgeHours = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)
    let cleanedCount = 0

    for (const [botId, session] of this.sessions.entries()) {
      if (session.lastUpdated < cutoff) {
        console.log(
          `[TranscriptStore] Cleaning up old session: ${botId} (last updated: ${session.lastUpdated})`,
        )
        this.sessions.delete(botId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`[TranscriptStore] Cleaned up ${cleanedCount} old sessions`)
    }
  }
}

// Export singleton instance
export const transcriptStore = new TranscriptStore()

// Clean up old sessions every hour
setInterval(() => {
  transcriptStore.cleanup()
}, 60 * 60 * 1000)
