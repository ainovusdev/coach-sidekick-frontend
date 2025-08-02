'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { websocketService, WebSocketStatus, EventHandler } from '@/services/websocket-service'
import { useAuth } from '@/contexts/auth-context'

interface WebSocketContextType {
  status: WebSocketStatus
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  send: (type: string, data: any) => void
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
  on: (event: string, handler: EventHandler) => () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { isAuthenticated } = useAuth()
  const [status, setStatus] = useState<WebSocketStatus>('disconnected')

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = websocketService.onStatusChange(setStatus)
    
    // Connect when authenticated
    if (isAuthenticated) {
      websocketService.connect()
    } else {
      websocketService.disconnect()
    }

    return () => {
      unsubscribe()
    }
  }, [isAuthenticated])

  const connect = useCallback(() => {
    websocketService.connect()
  }, [])

  const disconnect = useCallback(() => {
    websocketService.disconnect()
  }, [])

  const send = useCallback((type: string, data: any) => {
    websocketService.send(type, data)
  }, [])

  const joinRoom = useCallback((room: string) => {
    websocketService.joinRoom(room)
  }, [])

  const leaveRoom = useCallback((room: string) => {
    websocketService.leaveRoom(room)
  }, [])

  const on = useCallback((event: string, handler: EventHandler) => {
    return websocketService.on(event, handler)
  }, [])

  const value: WebSocketContextType = {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
    send,
    joinRoom,
    leaveRoom,
    on
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}