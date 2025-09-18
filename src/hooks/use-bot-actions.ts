import { useState } from 'react'
import { MeetingService } from '@/services/meeting-service'
import { SessionService } from '@/services/session-service'

export function useBotActions() {
  const [isLoading, setIsLoading] = useState(false)

  const stopBot = async (botId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      console.log('Stopping bot:', botId)

      // Stop the bot via backend
      const stopResponse = await MeetingService.stopBot(botId)
      console.log('Bot stopped successfully:', stopResponse)

      // Try to force save transcripts if session exists
      try {
        // Get session by bot ID first
        const session = await SessionService.getSessionByBotId(botId)
        if (session) {
          await MeetingService.forceSaveTranscripts(session.id)
          console.log('Transcripts saved for session:', session.id)
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
