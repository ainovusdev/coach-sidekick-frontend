import { useState } from 'react'

export function useBotActions() {
  const [isLoading, setIsLoading] = useState(false)

  const stopBot = async (botId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/recall/stop-bot/${botId}`, {
        method: 'POST',
      })

      return response.ok
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
