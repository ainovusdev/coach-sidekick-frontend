import { useState } from 'react'
import { MeetingService } from '@/services/meeting-service'
import { SessionService } from '@/services/session-service'

export function useBotActions() {
  const [isLoading, setIsLoading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

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

  const pauseBot = async (botId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      console.log('Pausing bot:', botId)

      // Pause the bot via backend
      const pauseResponse = await MeetingService.pauseBot(botId)
      console.log('Bot paused successfully:', pauseResponse)
      
      setIsPaused(true)
      return true
    } catch (error) {
      console.error('Failed to pause bot:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const resumeBot = async (botId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      console.log('Resuming bot:', botId)

      // Resume the bot via backend
      const resumeResponse = await MeetingService.resumeBot(botId)
      console.log('Bot resumed successfully:', resumeResponse)
      
      setIsPaused(false)
      return true
    } catch (error) {
      console.error('Failed to resume bot:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    stopBot,
    pauseBot,
    resumeBot,
    isLoading,
    isPaused,
  }
}
