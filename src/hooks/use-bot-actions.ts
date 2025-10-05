import { useState } from 'react'
import { MeetingService } from '@/services/meeting-service'
import { SessionService } from '@/services/session-service'

export function useBotActions() {
  const [isLoading, setIsLoading] = useState(false)

  const stopBot = async (
    botId: string,
    sessionId?: string,
  ): Promise<boolean> => {
    try {
      setIsLoading(true)
      console.log('Stopping bot:', botId)

      // Stop the bot via backend
      const stopResponse = await MeetingService.stopBot(botId)
      console.log('Bot stopped successfully:', stopResponse)

      // Try to force save transcripts if session exists
      try {
        let finalSessionId = sessionId
        // Only fetch session if not provided
        if (!finalSessionId) {
          const session = await SessionService.getSessionByBotId(botId)
          finalSessionId = session?.id
        }

        if (finalSessionId) {
          await MeetingService.forceSaveTranscripts(finalSessionId)
          console.log('Transcripts saved for session:', finalSessionId)
        }
      } catch (saveError) {
        console.warn('Failed to force save transcripts:', saveError)
        // Don't fail the whole operation if save fails
      }

      return true
    } catch (error) {
      console.error('Failed to stop bot:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    stopBot,
    isLoading,
  }
}
