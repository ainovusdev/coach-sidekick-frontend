import { TranscriptEntry } from '@/types/meeting'

type EventHandler = (data: any) => void

interface EventEmitterEvents {
  'transcript:new': { botId: string; entry: TranscriptEntry }
  'transcript:update': { botId: string; entryId: string; updates: Partial<TranscriptEntry> }
  'bot:status': { botId: string; status: string; timestamp: string }
  'analysis:update': { botId: string; analysisId: string; status: string; results?: any }
  'suggestion:new': { botId: string; suggestion: any }
}

class LocalEventEmitter {
  private eventHandlers: Map<string, Set<EventHandler>> = new Map()
  private static instance: LocalEventEmitter

  private constructor() {}

  static getInstance(): LocalEventEmitter {
    if (!LocalEventEmitter.instance) {
      LocalEventEmitter.instance = new LocalEventEmitter()
    }
    return LocalEventEmitter.instance
  }

  emit<K extends keyof EventEmitterEvents>(event: K, data: EventEmitterEvents[K]): void {
    console.log(`[LocalEventEmitter] Emitting ${event}:`, data)
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`[LocalEventEmitter] Error in handler for ${event}:`, error)
        }
      })
    }
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

  off(event: string, handler: EventHandler): void {
    this.eventHandlers.get(event)?.delete(handler)
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.eventHandlers.delete(event)
    } else {
      this.eventHandlers.clear()
    }
  }
}

export const localEventEmitter = LocalEventEmitter.getInstance()