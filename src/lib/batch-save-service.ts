import { transcriptStore } from './transcript-store'

class BatchSaveService {
  private saveQueue: Set<string> = new Set()

  async saveTranscriptBatch(
    botId: string,
  ): Promise<{ success: boolean; savedCount: number; error?: string }> {
    // Prevent duplicate saves for the same botId
    if (this.saveQueue.has(botId)) {
      return {
        success: false,
        savedCount: 0,
        error: 'Save already in progress',
      }
    }

    try {
      this.saveQueue.add(botId)
      transcriptStore.setBatchSaveInProgress(botId, true)

      const unsavedEntries = transcriptStore.getUnsavedEntries(botId)

      if (unsavedEntries.length === 0) {
        return { success: true, savedCount: 0 }
      }

      // Call the batch save API
      const response = await fetch('/api/meetings/save-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId,
          entries: transcriptStore.getSession(botId)?.transcript || [],
        }),
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to save batch')
      }

      const result = await response.json()

      // Mark entries as saved in the transcript store
      transcriptStore.markEntriesAsSaved(botId, result.savedCount)

      console.log(`Batch saved for ${botId}: ${result.savedCount} entries`)

      return {
        success: true,
        savedCount: result.savedCount,
      }
    } catch (error) {
      console.error(`Batch save failed for ${botId}:`, error)
      transcriptStore.setBatchSaveInProgress(botId, false)

      return {
        success: false,
        savedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      this.saveQueue.delete(botId)
    }
  }

  // Check all active sessions and trigger batch saves as needed
  async checkAndSaveAllSessions(): Promise<void> {
    const sessionIds = transcriptStore.getAllSessionIds()

    for (const botId of sessionIds) {
      if (transcriptStore.shouldTriggerBatchSave(botId)) {
        // Run async without waiting
        this.saveTranscriptBatch(botId).catch(error => {
          console.error(`Background batch save failed for ${botId}:`, error)
        })
      }
    }
  }

  // Force save all unsaved data for a specific session
  async forceSaveSession(
    botId: string,
  ): Promise<{ success: boolean; savedCount: number; error?: string }> {
    return this.saveTranscriptBatch(botId)
  }

  // Get save status for a session
  getSaveStatus(botId: string) {
    return transcriptStore.getBatchSaveInfo(botId)
  }
}

export const batchSaveService = new BatchSaveService()

// Auto-save check interval (every 30 seconds)
if (typeof window === 'undefined') {
  // Only run on server
  setInterval(() => {
    batchSaveService.checkAndSaveAllSessions()
  }, 30000)
}
