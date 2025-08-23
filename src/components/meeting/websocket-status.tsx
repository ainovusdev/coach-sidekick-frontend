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
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          showReconnect: false
        }
      case 'connected':
        return {
          icon: <Wifi className="h-3 w-3" />,
          label: 'Live',
          color: 'bg-green-100 text-green-800 border-green-300',
          showReconnect: false
        }
      case 'disconnected':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          label: 'Offline',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          showReconnect: true
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          label: 'Error',
          color: 'bg-red-100 text-red-800 border-red-300',
          showReconnect: true
        }
      default:
        return {
          icon: <WifiOff className="h-3 w-3" />,
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          showReconnect: false
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
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Reconnect
        </button>
      )}
    </div>
  )
}