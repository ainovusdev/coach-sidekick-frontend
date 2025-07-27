interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
  confidence: number
  is_final: boolean
  start_time?: number
  end_time?: number
}

export interface BotSession {
  bot: {
    id: string
    status: string
    meeting_url: string
    platform?: string
    meeting_id?: string
  }
  transcript: TranscriptEntry[]
  lastUpdated: Date
  createdAt: Date
  webhookEvents: number
  lastSavedIndex: number // Track how many entries have been saved to DB
  lastBatchSave: Date | null // When was the last batch save
  batchSaveInProgress: boolean // Prevent concurrent saves
  // Personal AI integration fields
  clientId?: string // Link to client for historical context
  uploadToPersonalAI: boolean // Whether to upload this session to Personal AI
  personalAISessionId?: string // Personal AI session identifier
  personalAIUploaded: boolean // Track upload status
  lastPersonalAIUpload: Date | null // When was the last upload
}

interface SessionInfo {
  botId: string
  status: string
  meeting_url: string
  platform?: string
  meeting_id?: string
  transcriptCount: number
  lastUpdated: Date
  createdAt: Date
  webhookEvents: number
}

class TranscriptStore {
  private sessions: Map<string, BotSession> = new Map()
  private instanceId: string = Math.random().toString(36).substring(2, 9)

  constructor() {
    console.log(`[TRANSCRIPT_STORE] New instance created with ID: ${this.instanceId}`)
  }

  getSession(botId: string): BotSession | null {
    console.log(`[TRANSCRIPT_STORE] Instance ${this.instanceId}: getSession called for ${botId}`)
    console.log(`[TRANSCRIPT_STORE] Instance ${this.instanceId}: Available sessions:`, Array.from(this.sessions.keys()))
    const session = this.sessions.get(botId)
    return session || null
  }

  initSession(
    botId: string,
    botData: {
      id: string
      status: string
      meeting_url: string
      platform?: string
      meeting_id?: string
    },
    options?: {
      clientId?: string
      uploadToPersonalAI?: boolean
    }
  ): void {
    if (this.sessions.has(botId)) {
      const existingSession = this.sessions.get(botId)!
      existingSession.bot = botData
      existingSession.lastUpdated = new Date()
      
      // Update Personal AI options if provided
      if (options?.clientId) {
        existingSession.clientId = options.clientId
      }
      if (options?.uploadToPersonalAI !== undefined) {
        existingSession.uploadToPersonalAI = options.uploadToPersonalAI
      }
      return
    }

    const session: BotSession = {
      bot: botData,
      transcript: [],
      lastUpdated: new Date(),
      createdAt: new Date(),
      webhookEvents: 0,
      lastSavedIndex: 0,
      lastBatchSave: null,
      batchSaveInProgress: false,
      // Personal AI fields
      clientId: options?.clientId,
      uploadToPersonalAI: options?.uploadToPersonalAI || true, // Default to true
      personalAISessionId: undefined,
      personalAIUploaded: false,
      lastPersonalAIUpload: null,
    }

    this.sessions.set(botId, session)
  }

  updateBotStatus(botId: string, status: string): void {
    const session = this.sessions.get(botId)
    if (session) {
      session.bot.status = status
      session.lastUpdated = new Date()
      session.webhookEvents++
    }
  }

  addTranscriptEntry(botId: string, entry: TranscriptEntry): void {
    let session = this.sessions.get(botId)

    if (!session) {
      this.initSession(botId, {
        id: botId,
        status: 'unknown',
        meeting_url: '#',
        platform: 'unknown',
        meeting_id: undefined,
      })
      session = this.sessions.get(botId)!
    }

    session.webhookEvents++

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

  getAllSessionIds(): string[] {
    const ids = Array.from(this.sessions.keys())
    return ids
  }

  getSessionInfo(botId: string): SessionInfo | null {
    const session = this.sessions.get(botId)
    if (!session) {
      return null
    }

    const info: SessionInfo = {
      botId,
      status: session.bot.status,
      meeting_url: session.bot.meeting_url,
      platform: session.bot.platform,
      meeting_id: session.bot.meeting_id,
      transcriptCount: session.transcript.length,
      lastUpdated: session.lastUpdated,
      createdAt: session.createdAt,
      webhookEvents: session.webhookEvents,
    }

    return info
  }

  getAllSessionsInfo(): Record<string, SessionInfo> {
    const result: Record<string, SessionInfo> = {}

    for (const [botId, session] of this.sessions.entries()) {
      result[botId] = {
        botId,
        status: session.bot.status,
        meeting_url: session.bot.meeting_url,
        platform: session.bot.platform,
        meeting_id: session.bot.meeting_id,
        transcriptCount: session.transcript.length,
        lastUpdated: session.lastUpdated,
        createdAt: session.createdAt,
        webhookEvents: session.webhookEvents,
      }
    }

    return result
  }

  cleanupOldSessions(maxAgeHours: number = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)

    for (const [botId, session] of this.sessions.entries()) {
      if (session.lastUpdated < cutoff) {
        this.sessions.delete(botId)
      }
    }
  }

  cleanupSession(botId: string): void {
    this.sessions.delete(botId)
  }

  // Batch saving methods
  getUnsavedEntries(botId: string): TranscriptEntry[] {
    const session = this.sessions.get(botId)
    if (!session) return []

    return session.transcript.slice(session.lastSavedIndex)
  }

  markEntriesAsSaved(botId: string, count: number): void {
    const session = this.sessions.get(botId)
    if (session) {
      session.lastSavedIndex += count
      session.lastBatchSave = new Date()
      session.batchSaveInProgress = false
    }
  }

  setBatchSaveInProgress(botId: string, inProgress: boolean): void {
    const session = this.sessions.get(botId)
    if (session) {
      session.batchSaveInProgress = inProgress
    }
  }

  shouldTriggerBatchSave(
    botId: string,
    batchSize: number = 10,
    intervalMs: number = 30000,
  ): boolean {
    const session = this.sessions.get(botId)
    if (!session || session.batchSaveInProgress) return false

    const unsavedCount = session.transcript.length - session.lastSavedIndex
    const timeSinceLastSave = session.lastBatchSave
      ? Date.now() - session.lastBatchSave.getTime()
      : Date.now() - session.createdAt.getTime()

    // Trigger if we have enough unsaved entries OR enough time has passed
    return (
      unsavedCount >= batchSize ||
      (unsavedCount > 0 && timeSinceLastSave >= intervalMs)
    )
  }

  getBatchSaveInfo(botId: string): {
    totalEntries: number
    savedEntries: number
    unsavedEntries: number
    lastBatchSave: Date | null
    batchSaveInProgress: boolean
  } | null {
    const session = this.sessions.get(botId)
    if (!session) return null

    return {
      totalEntries: session.transcript.length,
      savedEntries: session.lastSavedIndex,
      unsavedEntries: session.transcript.length - session.lastSavedIndex,
      lastBatchSave: session.lastBatchSave,
      batchSaveInProgress: session.batchSaveInProgress,
    }
  }

  // Personal AI integration methods
  setClientId(botId: string, clientId: string): void {
    const session = this.sessions.get(botId)
    if (session) {
      session.clientId = clientId
      session.lastUpdated = new Date()
    }
  }

  getClientId(botId: string): string | undefined {
    const session = this.sessions.get(botId)
    return session?.clientId
  }

  setPersonalAISessionId(botId: string, personalAISessionId: string): void {
    const session = this.sessions.get(botId)
    if (session) {
      session.personalAISessionId = personalAISessionId
      session.lastUpdated = new Date()
    }
  }

  getPersonalAISessionId(botId: string): string | undefined {
    const session = this.sessions.get(botId)
    return session?.personalAISessionId
  }

  setUploadToPersonalAI(botId: string, upload: boolean): void {
    const session = this.sessions.get(botId)
    if (session) {
      session.uploadToPersonalAI = upload
      session.lastUpdated = new Date()
    }
  }

  shouldUploadToPersonalAI(botId: string): boolean {
    const session = this.sessions.get(botId)
    return session?.uploadToPersonalAI || false
  }

  markPersonalAIUploaded(botId: string): void {
    const session = this.sessions.get(botId)
    if (session) {
      session.personalAIUploaded = true
      session.lastPersonalAIUpload = new Date()
      session.lastUpdated = new Date()
    }
  }

  isPersonalAIUploaded(botId: string): boolean {
    const session = this.sessions.get(botId)
    return session?.personalAIUploaded || false
  }

  shouldTriggerPersonalAIUpload(botId: string): boolean {
    const session = this.sessions.get(botId)
    if (!session || !session.uploadToPersonalAI || session.personalAIUploaded) {
      return false
    }

    // Only upload if we have final transcript entries and the session is complete
    const finalEntries = session.transcript.filter(entry => entry.is_final)
    const sessionComplete = session.bot.status === 'ended' || session.bot.status === 'stopped'
    
    return finalEntries.length > 0 && sessionComplete
  }

  getPersonalAIInfo(botId: string): {
    clientId?: string
    uploadToPersonalAI: boolean
    personalAISessionId?: string
    personalAIUploaded: boolean
    lastPersonalAIUpload: Date | null
  } | null {
    const session = this.sessions.get(botId)
    if (!session) return null

    return {
      clientId: session.clientId,
      uploadToPersonalAI: session.uploadToPersonalAI,
      personalAISessionId: session.personalAISessionId,
      personalAIUploaded: session.personalAIUploaded,
      lastPersonalAIUpload: session.lastPersonalAIUpload,
    }
  }
}

// Ensure singleton pattern works in development with hot reloading
declare global {
  var __transcriptStore__: TranscriptStore | undefined
}

export const transcriptStore = global.__transcriptStore__ ?? new TranscriptStore()

if (process.env.NODE_ENV !== 'production') {
  global.__transcriptStore__ = transcriptStore
}
