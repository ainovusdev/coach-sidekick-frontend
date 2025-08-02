import authService from '@/services/auth-service'

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WebSocketEvent {
  type: string
  data: any
  timestamp: string
}

export type EventHandler = (data: any) => void

interface WebSocketServiceConfig {
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

class WebSocketService {
  private ws: WebSocket | null = null
  private url: string
  private reconnectInterval: number
  private maxReconnectAttempts: number
  private heartbeatInterval: number
  private reconnectAttempts: number = 0
  private eventHandlers: Map<string, Set<EventHandler>> = new Map()
  private statusChangeHandlers: Set<(status: WebSocketStatus) => void> = new Set()
  private currentStatus: WebSocketStatus = 'disconnected'
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private joinedRooms: Set<string> = new Set()
  private messageQueue: WebSocketEvent[] = []

  constructor(config: WebSocketServiceConfig = {}) {
    this.url = config.url || this.buildWebSocketUrl()
    this.reconnectInterval = config.reconnectInterval || 5000
    this.maxReconnectAttempts = config.maxReconnectAttempts || 10
    this.heartbeatInterval = config.heartbeatInterval || 30000
  }

  private buildWebSocketUrl(): string {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1'
    // Remove /api/v1 suffix if present and convert to ws://
    const baseUrl = backendUrl.replace(/\/api\/v1\/?$/, '').replace(/^http/, 'ws')
    return `${baseUrl}/ws`
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected')
      return
    }

    this.updateStatus('connecting')
    
    try {
      const token = authService.getToken()
      if (!token) {
        console.error('[WebSocket] No auth token available')
        this.updateStatus('error')
        return
      }

      // Add token as query parameter for authentication
      const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`
      
      this.ws = new WebSocket(wsUrl)
      this.setupEventListeners()
    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
      this.updateStatus('error')
      this.scheduleReconnect()
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected')
      this.updateStatus('connected')
      this.reconnectAttempts = 0
      
      // Rejoin rooms after reconnection
      this.joinedRooms.forEach(room => {
        this.send('join', { room })
      })

      // Process queued messages
      this.processMessageQueue()

      // Start heartbeat
      this.startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('[WebSocket] Received:', message.type, message.data)
        
        // Handle system messages
        if (message.type === 'pong') {
          return // Heartbeat response
        }

        if (message.type === 'error') {
          console.error('[WebSocket] Server error:', message.data)
          return
        }

        // Emit to event handlers
        this.emit(message.type, message.data)
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error)
      this.updateStatus('error')
    }

    this.ws.onclose = (event) => {
      console.log('[WebSocket] Disconnected:', event.code, event.reason)
      this.updateStatus('disconnected')
      this.stopHeartbeat()
      
      // Schedule reconnection if not intentional disconnect
      if (event.code !== 1000) {
        this.scheduleReconnect()
      }
    }
  }

  private updateStatus(status: WebSocketStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status
      this.statusChangeHandlers.forEach(handler => handler(status))
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached')
      return
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectInterval * this.reconnectAttempts, 30000)
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', {})
      }
    }, this.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      if (message) {
        this.ws.send(JSON.stringify(message))
      }
    }
  }

  disconnect(): void {
    console.log('[WebSocket] Disconnecting')
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.updateStatus('disconnected')
    this.messageQueue = []
    this.joinedRooms.clear()
  }

  send(type: string, data: any): void {
    const message: WebSocketEvent = {
      type,
      data,
      timestamp: new Date().toISOString()
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue message if not connected
      console.log('[WebSocket] Queueing message:', type)
      this.messageQueue.push(message)
      
      // Try to connect if disconnected
      if (this.currentStatus === 'disconnected') {
        this.connect()
      }
    }
  }

  joinRoom(room: string): void {
    this.joinedRooms.add(room)
    this.send('join', { room })
  }

  leaveRoom(room: string): void {
    this.joinedRooms.delete(room)
    this.send('leave', { room })
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    
    this.eventHandlers.get(event)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  onStatusChange(handler: (status: WebSocketStatus) => void): () => void {
    this.statusChangeHandlers.add(handler)
    
    // Call immediately with current status
    handler(this.currentStatus)
    
    // Return unsubscribe function
    return () => {
      this.statusChangeHandlers.delete(handler)
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`[WebSocket] Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  getStatus(): WebSocketStatus {
    return this.currentStatus
  }

  isConnected(): boolean {
    return this.currentStatus === 'connected'
  }
}

// Create singleton instance
export const websocketService = new WebSocketService()

// Auto-connect when authenticated
if (typeof window !== 'undefined') {
  // Check auth status and connect if authenticated
  const token = authService.getToken()
  if (token && authService.isAuthenticated()) {
    websocketService.connect()
  }
}