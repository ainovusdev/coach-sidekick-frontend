import authService from '@/services/auth-service'

export type WebSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

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
  private statusChangeHandlers: Set<(status: WebSocketStatus) => void> =
    new Set()
  private currentStatus: WebSocketStatus = 'disconnected'
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private joinedRooms: Set<string> = new Set()
  private messageQueue: WebSocketEvent[] = []
  private intentionalDisconnect: boolean = false
  private lastPongTime: number = Date.now()

  constructor(config: WebSocketServiceConfig = {}) {
    this.url = config.url || this.buildWebSocketUrl()
    this.reconnectInterval = config.reconnectInterval || 1000 // Start at 1s for faster initial reconnect
    this.maxReconnectAttempts = config.maxReconnectAttempts || 15 // More attempts for long meetings
    this.heartbeatInterval = config.heartbeatInterval || 25000 // Slightly less than server's 30s timeout

    // Setup visibility change handler for tab switching
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      // Tab became visible - check connection and reconnect if needed
      if (this.currentStatus !== 'connected' && !this.intentionalDisconnect) {
        this.reconnectAttempts = 0 // Reset attempts when user returns
        this.connect()
      }
    }
  }

  private buildWebSocketUrl(): string {
    // Use dedicated WebSocket URL if available
    if (process.env.NEXT_PUBLIC_WS_URL) {
      return `${process.env.NEXT_PUBLIC_WS_URL}/ws/connect`
    }

    // Fallback to deriving from API URL
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    // Remove /api/v1 suffix if present and convert to ws://
    const baseUrl = backendUrl
      .replace(/\/api\/v1\/?$/, '')
      .replace(/^http/, 'ws')
    return `${baseUrl}/ws/connect`
  }

  connect(): void {
    // Check if already connected or connecting
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      return
    }

    // Reset intentional disconnect flag when connecting
    this.intentionalDisconnect = false
    this.updateStatus('connecting')

    try {
      // Check if token is valid (not expired) before attempting connection
      if (!authService.isAuthenticated()) {
        console.warn(
          '[WebSocket] Token expired or invalid - skipping connection',
        )
        this.updateStatus('disconnected')
        return
      }

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

    this.ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data)

        // Handle system messages
        if (message.type === 'pong' || message.type === 'PONG') {
          this.lastPongTime = Date.now()
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

    this.ws.onerror = () => {
      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[WebSocket] Connection error occurred')
      }
      this.updateStatus('error')
      // Schedule reconnect on error (if not intentional disconnect)
      if (!this.intentionalDisconnect) {
        this.scheduleReconnect()
      }
    }

    this.ws.onclose = event => {
      this.updateStatus('disconnected')
      this.stopHeartbeat()

      // Reconnect if not an intentional disconnect
      const isIntentionalClose =
        event.code === 1000 && event.reason === 'Client disconnect'

      if (!this.intentionalDisconnect && !isIntentionalClose) {
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
    // Don't reconnect if intentionally disconnected
    if (this.intentionalDisconnect) {
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached')
      // Emit an event so UI can show reconnect button
      this.emit('max_reconnect_attempts', { attempts: this.reconnectAttempts })
      return
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectAttempts++

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s (capped at 30s)
    // With jitter to prevent thundering herd
    const exponentialDelay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000,
    )
    // Add random jitter (0-1000ms) to prevent synchronized reconnects
    const jitter = Math.random() * 1000
    const delay = exponentialDelay + jitter

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
    while (
      this.messageQueue.length > 0 &&
      this.ws?.readyState === WebSocket.OPEN
    ) {
      const message = this.messageQueue.shift()
      if (message) {
        this.ws.send(JSON.stringify(message))
      }
    }
  }

  disconnect(): void {
    // Mark as intentional disconnect to prevent auto-reconnect
    this.intentionalDisconnect = true

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      // Only close if the WebSocket is OPEN or CLOSING
      // Don't close if CONNECTING (readyState = 0) to avoid the error
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CLOSING
      ) {
        this.ws.close(1000, 'Client disconnect')
      }
      this.ws = null
    }

    this.updateStatus('disconnected')
    this.messageQueue = []

    // Only clear joined rooms on intentional disconnect
    // This preserves rooms for auto-reconnect scenarios
    if (this.joinedRooms) {
      this.joinedRooms.clear()
    }

    // Reset reconnect attempts for next connection
    this.reconnectAttempts = 0
  }

  /**
   * Force reconnect - useful when user manually triggers reconnection
   */
  forceReconnect(): void {
    this.intentionalDisconnect = false
    this.reconnectAttempts = 0

    // Close existing connection if any
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Force reconnect')
      }
      this.ws = null
    }

    // Connect immediately
    this.connect()
  }

  send(type: string, data: any): void {
    const message: WebSocketEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue message if not connected
      this.messageQueue.push(message)

      // Try to connect if disconnected
      if (this.currentStatus === 'disconnected') {
        this.connect()
      }
    }
  }

  joinRoom(room: string): void {
    if (!this.joinedRooms) {
      this.joinedRooms = new Set()
    }

    this.joinedRooms.add(room)
    this.send('join', { room })
  }

  leaveRoom(room: string): void {
    if (!this.joinedRooms) {
      this.joinedRooms = new Set()
    }
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
          console.error(
            `[WebSocket] Error in event handler for ${event}:`,
            error,
          )
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
