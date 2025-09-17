'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '@/contexts/websocket-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  WifiIcon,
  WifiOffIcon,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'

interface WebSocketControlProps {
  botId: string
  className?: string
}

export function WebSocketControl({
  botId,
  className = '',
}: WebSocketControlProps) {
  const { status, isConnected, connect, disconnect, joinRoom, leaveRoom } =
    useWebSocket()
  const [roomJoined, setRoomJoined] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const roomName = `bot:${botId}`

  // Don't auto-reconnect, let user control it
  // useEffect(() => {
  //   if (!hasReconnected && status === 'connected') {
  //     console.log('[WebSocketControl] Performing initial reconnect for fresh connection')
  //     handleReconnect()
  //     setHasReconnected(true)
  //   }
  // }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-join room when connected
  useEffect(() => {
    if (isConnected && !roomJoined && botId) {
      // Add a small delay after connection to ensure socket is ready
      setTimeout(() => {
        handleJoinRoom()
      }, 500)
    }
  }, [isConnected, botId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = useCallback(() => {
    console.log('[WebSocketControl] Connecting...')
    connect()
  }, [connect])

  const handleDisconnect = useCallback(() => {
    console.log('[WebSocketControl] Disconnecting...')
    if (roomJoined) {
      leaveRoom(roomName)
      setRoomJoined(false)
    }
    disconnect()
  }, [disconnect, leaveRoom, roomJoined, roomName])

  const handleReconnect = useCallback(() => {
    console.log('[WebSocketControl] Reconnecting with fresh connection...')
    setRoomJoined(false)

    // Disconnect first
    disconnect()

    // Wait a moment then reconnect
    setTimeout(() => {
      connect()
    }, 100)
  }, [connect, disconnect])

  const handleJoinRoom = useCallback(async () => {
    if (!isConnected) {
      console.log('[WebSocketControl] Cannot join room - not connected')
      return
    }

    setIsJoining(true)
    console.log(`[WebSocketControl] Joining room: ${roomName}`)

    try {
      joinRoom(roomName)

      // Wait a bit to ensure the join message is sent
      await new Promise(resolve => setTimeout(resolve, 500))

      setRoomJoined(true)
      console.log(`[WebSocketControl] Successfully joined room: ${roomName}`)
    } catch (error) {
      console.error('[WebSocketControl] Failed to join room:', error)
    } finally {
      setIsJoining(false)
    }
  }, [isConnected, joinRoom, roomName])

  const handleLeaveRoom = useCallback(() => {
    console.log(`[WebSocketControl] Leaving room: ${roomName}`)
    leaveRoom(roomName)
    setRoomJoined(false)
  }, [leaveRoom, roomName])

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <WifiIcon className="h-4 w-4 text-green-600" />
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <WifiOffIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'success'
      case 'connecting':
        return 'warning'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          {/* Status Display */}
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={getStatusColor() as any} className="text-xs">
              {status.toUpperCase()}
            </Badge>
            {roomJoined && (
              <Badge variant="default" className="text-xs bg-blue-600">
                Room Joined
              </Badge>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            {!isConnected ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleConnect}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Connect
              </Button>
            ) : (
              <>
                {!roomJoined ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleJoinRoom}
                    disabled={isJoining}
                    className="text-xs"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Join Room
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLeaveRoom}
                    className="text-xs"
                  >
                    Leave Room
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReconnect}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reconnect
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDisconnect}
                  className="text-xs"
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-2 pt-2 border-t text-xs text-gray-500">
          <div>Bot ID: {botId}</div>
          <div>Room: {roomName}</div>
          <div>
            Status: {status} | Room: {roomJoined ? 'Joined' : 'Not Joined'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
