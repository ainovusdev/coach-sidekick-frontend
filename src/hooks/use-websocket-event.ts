import { useEffect } from 'react'
import { useWebSocket } from '@/contexts/websocket-context'

/**
 * Hook to subscribe to a specific WebSocket event
 * @param event - The event name to listen for
 * @param handler - The callback function to handle the event data
 * @param deps - Optional dependency array for the effect
 */
export function useWebSocketEvent(
  event: string,
  handler: (data: any) => void,
  deps?: React.DependencyList
) {
  const { on } = useWebSocket()

  useEffect(() => {
    const unsubscribe = on(event, handler)
    return unsubscribe
  }, deps ? [event, ...deps] : [event]) // eslint-disable-line react-hooks/exhaustive-deps
}