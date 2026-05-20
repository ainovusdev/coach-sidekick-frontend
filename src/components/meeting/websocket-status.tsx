'use client'

import { useWebSocket } from '@/contexts/websocket-context'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react'

export function WebSocketStatus() {
  const { status, connect } = useWebSocket()

  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          label: 'Connecting...',
          color: 'bg-amber-token-bg text-amber-token border-amber-token',
          showReconnect: false,
        }
      case 'connected':
        return {
          icon: <Wifi className="h-3 w-3" />,
          label: 'Live',
          color: 'bg-forest-bg text-forest border-forest',
          showReconnect: false,
        }
      case 'disconnected':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          label: 'Offline',
          color: 'bg-surface-3 text-ink-2 border-line-strong',
          showReconnect: true,
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          label: 'Error',
          color: 'bg-vermillion-bg text-vermillion border-vermillion',
          showReconnect: true,
        }
      default:
        return {
          icon: <WifiOff className="h-3 w-3" />,
          label: 'Unknown',
          color: 'bg-surface-3 text-ink-2 border-line-strong',
          showReconnect: false,
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={`text-xs font-medium border ${config.color} px-2 py-0.5`}
      >
        <div className="flex items-center gap-1.5">
          {config.icon}
          <span>{config.label}</span>
        </div>
      </Badge>

      {config.showReconnect && (
        <button
          onClick={connect}
          className="text-xs text-ds-accent hover:text-ds-accent underline"
        >
          Reconnect
        </button>
      )}
    </div>
  )
}
