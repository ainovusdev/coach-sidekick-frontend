import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SessionService } from '@/services/session-service'
import { TranscriptService } from '@/services/transcript-service'
import { useWebSocketEvent } from '@/hooks/use-websocket-event'
import { useWebSocket } from '@/contexts/websocket-context'
import {
  Cloud,
  CloudOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

interface BatchSaveStatusProps {
  botId: string
}

interface SaveStatus {
  totalEntries: number
  savedEntries: number
  unsavedEntries: number
  lastBatchSave: string | null
  batchSaveInProgress: boolean
}

export function BatchSaveStatus({ botId }: BatchSaveStatusProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const { isConnected } = useWebSocket()

  // Get session ID from bot ID
  useEffect(() => {
    const getSessionId = async () => {
      try {
        const session = await SessionService.getSessionByBotId(botId)
        setSessionId(session.id)
      } catch (err) {
        console.error('Failed to get session ID:', err)
      }
    }
    getSessionId()
  }, [botId])

  const fetchSaveStatus = useCallback(async () => {
    if (!sessionId) return
    
    try {
      setError(null)
      const status = await TranscriptService.getBatchStatus(sessionId)
      
      setSaveStatus({
        totalEntries: status.saved_count,
        savedEntries: status.saved_count,
        unsavedEntries: 0,
        lastBatchSave: status.last_saved_at,
        batchSaveInProgress: status.status === 'in_progress',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const forceSave = async () => {
    if (!sessionId) return
    
    try {
      setLoading(true)
      await TranscriptService.forceSave(sessionId)
      
      // Refresh status after force save
      await fetchSaveStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to force save')
    } finally {
      setLoading(false)
    }
  }

  // WebSocket event handler for save status updates
  useWebSocketEvent('save:status', (data: any) => {
    if (data.sessionId === sessionId) {
      console.log('[WebSocket] Save status update:', data)
      
      setSaveStatus({
        totalEntries: data.savedCount || 0,
        savedEntries: data.savedCount || 0,
        unsavedEntries: data.unsavedCount || 0,
        lastBatchSave: data.timestamp || null,
        batchSaveInProgress: data.status === 'in_progress'
      })
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId) {
      fetchSaveStatus()

      // Poll for updates only when WebSocket is disconnected
      if (!isConnected) {
        console.log('[Batch Save] Starting polling (WebSocket disconnected)')
        const interval = setInterval(fetchSaveStatus, 10000)
        return () => clearInterval(interval)
      }
    }
  }, [sessionId, isConnected, fetchSaveStatus])

  if (loading && !saveStatus) {
    return (
      <Card className="border-gray-200">
        <CardContent className="flex items-center gap-2 p-3">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="text-xs text-gray-600">Checking save status...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-2 p-3">
          <CloudOff className="h-4 w-4 text-red-600" />
          <span className="text-xs text-red-700">Save status unavailable</span>
        </CardContent>
      </Card>
    )
  }

  if (!saveStatus) return null

  const getSaveStatusIcon = () => {
    if (saveStatus.batchSaveInProgress) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
    }

    if (saveStatus.unsavedEntries === 0) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }

    if (saveStatus.unsavedEntries > 20) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }

    return <Cloud className="h-4 w-4 text-blue-600" />
  }

  const getSaveStatusText = () => {
    if (saveStatus.batchSaveInProgress) {
      return 'Saving...'
    }

    if (saveStatus.unsavedEntries === 0) {
      return 'All saved'
    }

    return `${saveStatus.unsavedEntries} pending`
  }

  const getSaveStatusColor = () => {
    if (saveStatus.batchSaveInProgress) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }

    if (saveStatus.unsavedEntries === 0) {
      return 'bg-green-100 text-green-800 border-green-200'
    }

    if (saveStatus.unsavedEntries > 20) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }

    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const formatLastSave = (dateString: string | null) => {
    if (!dateString) return 'Never'

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    return date.toLocaleTimeString()
  }

  return (
    <Card className="border-gray-200">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSaveStatusIcon()}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Badge className={getSaveStatusColor()}>
                  {getSaveStatusText()}
                </Badge>
                <span className="text-xs text-gray-600">
                  {saveStatus.savedEntries}/{saveStatus.totalEntries} saved
                </span>
              </div>
              <span className="text-xs text-gray-500 mt-1">
                Last save: {formatLastSave(saveStatus.lastBatchSave)}
              </span>
            </div>
          </div>

          {saveStatus.unsavedEntries > 0 && !saveStatus.batchSaveInProgress && (
            <Button
              variant="ghost"
              size="sm"
              onClick={forceSave}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
