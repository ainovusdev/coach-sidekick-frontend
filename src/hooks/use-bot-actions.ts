import { useState } from 'react'
import { ApiClient } from '@/lib/api-client'

export function useBotActions() {
  const [isLoading, setIsLoading] = useState(false)

  const stopBot = async (botId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      console.log('Stopping bot:', botId)

      const response = await ApiClient.post(`/api/recall/stop-bot/${botId}`, {})

      if (response.ok) {
        const data = await response.json()
        console.log('Bot stopped successfully:', data)

        if (data.savedMeetingData) {
          console.log('Meeting data saved:', {
            transcriptEntries: data.savedMeetingData.transcriptEntries,
            analysisCount: data.savedMeetingData.analysisCount,
            sessionId: data.savedMeetingData.sessionId,
          })
        }
        return true
      } else {
        // Log the response for debugging
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }))
        console.error('Stop bot API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
        return false
      }
    } catch (error) {
      console.error('Failed to stop bot (network/request error):', error)
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
