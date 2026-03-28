'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { websocketService } from '@/services/websocket-service'
import { useAuth } from '@/contexts/auth-context'
import { ManualSessionService } from '@/services/manual-session-service'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

export interface ProcessingSession {
  sessionId: string
  title: string
  progress: number
  status: 'processing' | 'completed' | 'failed'
}

interface ProcessingContextType {
  processingSessions: Map<string, ProcessingSession>
  addProcessingSession: (sessionId: string, title: string) => void
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(
  undefined,
)

export function useProcessing() {
  const context = useContext(ProcessingContext)
  if (!context) {
    throw new Error('useProcessing must be used within ProcessingProvider')
  }
  return context
}

// Optional hook that doesn't throw if outside provider (for components that may or may not have the provider)
export function useOptionalProcessing() {
  return useContext(ProcessingContext)
}

interface ProcessingProviderProps {
  children: ReactNode
}

export function ProcessingProvider({ children }: ProcessingProviderProps) {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [processingSessions, setProcessingSessions] = useState<
    Map<string, ProcessingSession>
  >(new Map())
  const autoRemoveTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const addProcessingSession = useCallback(
    (sessionId: string, title: string) => {
      setProcessingSessions(prev => {
        const next = new Map(prev)
        next.set(sessionId, {
          sessionId,
          title,
          progress: 0,
          status: 'processing',
        })
        return next
      })
    },
    [],
  )

  const removeSession = useCallback((sessionId: string) => {
    setProcessingSessions(prev => {
      const next = new Map(prev)
      next.delete(sessionId)
      return next
    })
    // Clear any auto-remove timer
    const timer = autoRemoveTimers.current.get(sessionId)
    if (timer) {
      clearTimeout(timer)
      autoRemoveTimers.current.delete(sessionId)
    }
  }, [])

  const scheduleAutoRemove = useCallback(
    (sessionId: string, delayMs: number) => {
      // Clear existing timer if any
      const existing = autoRemoveTimers.current.get(sessionId)
      if (existing) clearTimeout(existing)

      const timer = setTimeout(() => {
        removeSession(sessionId)
      }, delayMs)
      autoRemoveTimers.current.set(sessionId, timer)
    },
    [removeSession],
  )

  // Hydrate on mount — fetch any sessions that are currently processing
  useEffect(() => {
    if (!isAuthenticated) return

    ManualSessionService.getProcessingSessions()
      .then(sessions => {
        if (sessions.length > 0) {
          setProcessingSessions(prev => {
            const next = new Map(prev)
            for (const s of sessions) {
              // Don't overwrite sessions already tracked (e.g., just uploaded)
              if (!next.has(s.session_id)) {
                next.set(s.session_id, {
                  sessionId: s.session_id,
                  title: s.title || 'Session',
                  progress: s.transcription_progress,
                  status: 'processing',
                })
              }
            }
            return next
          })
        }
      })
      .catch(() => {
        // Silently fail — hydration is best-effort
      })
  }, [isAuthenticated])

  // Listen to WebSocket events
  useEffect(() => {
    const unsub1 = websocketService.on(
      'session:processing_progress',
      (data: any) => {
        const { session_id, progress, status, title } = data
        setProcessingSessions(prev => {
          const next = new Map(prev)
          const existing = next.get(session_id)
          next.set(session_id, {
            sessionId: session_id,
            progress,
            status:
              status === 'completed' || status === 'failed'
                ? status
                : 'processing',
            title: existing?.title || title || 'Session',
          })
          return next
        })
      },
    )

    const unsub2 = websocketService.on(
      'session:processing_complete',
      (data: any) => {
        const { session_id } = data
        setProcessingSessions(prev => {
          const next = new Map(prev)
          const existing = next.get(session_id)
          if (existing) {
            next.set(session_id, {
              ...existing,
              progress: 100,
              status: 'completed',
            })
          } else {
            next.set(session_id, {
              sessionId: session_id,
              title: 'Session',
              progress: 100,
              status: 'completed',
            })
          }
          return next
        })

        // Invalidate session queries so lists/details refresh
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all })

        // Auto-remove after 15 seconds
        scheduleAutoRemove(session_id, 15000)
      },
    )

    const unsub3 = websocketService.on(
      'session:processing_failed',
      (data: any) => {
        const { session_id } = data
        setProcessingSessions(prev => {
          const next = new Map(prev)
          const existing = next.get(session_id)
          if (existing) {
            next.set(session_id, { ...existing, progress: 0, status: 'failed' })
          } else {
            next.set(session_id, {
              sessionId: session_id,
              title: 'Session',
              progress: 0,
              status: 'failed',
            })
          }
          return next
        })

        // Auto-remove after 10 seconds
        scheduleAutoRemove(session_id, 10000)
      },
    )

    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [queryClient, scheduleAutoRemove])

  // Re-hydrate when WebSocket reconnects (catch events missed during disconnect)
  useEffect(() => {
    const unsub = websocketService.on('connection', () => {
      if (!isAuthenticated) return
      ManualSessionService.getProcessingSessions()
        .then(sessions => {
          setProcessingSessions(prev => {
            const next = new Map(prev)
            // Remove sessions that are no longer processing (completed while disconnected)
            for (const [id, session] of next) {
              if (session.status === 'processing') {
                const stillProcessing = sessions.some(s => s.session_id === id)
                if (!stillProcessing) {
                  next.delete(id)
                }
              }
            }
            // Add any new processing sessions
            for (const s of sessions) {
              if (!next.has(s.session_id)) {
                next.set(s.session_id, {
                  sessionId: s.session_id,
                  title: s.title || 'Session',
                  progress: s.transcription_progress,
                  status: 'processing',
                })
              }
            }
            return next
          })
        })
        .catch(() => {})
    })
    return unsub
  }, [isAuthenticated])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of autoRemoveTimers.current.values()) {
        clearTimeout(timer)
      }
    }
  }, [])

  return (
    <ProcessingContext.Provider
      value={{ processingSessions, addProcessingSession }}
    >
      {children}
      <ProcessingCards
        sessions={processingSessions}
        onDismiss={removeSession}
      />
    </ProcessingContext.Provider>
  )
}

// ── Floating Cards UI ──────────────────────────────────────────────────

interface ProcessingCardsProps {
  sessions: Map<string, ProcessingSession>
  onDismiss: (sessionId: string) => void
}

function ProcessingCards({ sessions, onDismiss }: ProcessingCardsProps) {
  if (sessions.size === 0) return null

  const entries = Array.from(sessions.values())

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {entries.map(session => (
        <ProcessingCard
          key={session.sessionId}
          session={session}
          onDismiss={() => onDismiss(session.sessionId)}
        />
      ))}
    </div>
  )
}

interface ProcessingCardProps {
  session: ProcessingSession
  onDismiss: () => void
}

function ProcessingCard({ session, onDismiss }: ProcessingCardProps) {
  const isCompleted = session.status === 'completed'
  const isFailed = session.status === 'failed'
  const isProcessing = session.status === 'processing'

  return (
    <div
      className={`
        rounded-lg border bg-background p-3 shadow-lg
        animate-in slide-in-from-right-5 fade-in duration-300
        ${isCompleted ? 'border-green-500/30' : ''}
        ${isFailed ? 'border-red-500/30' : ''}
        ${isProcessing ? 'border-border' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isProcessing && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          )}
          {isCompleted && (
            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
          )}
          {isFailed && (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          )}
          <span className="text-sm font-medium truncate">{session.title}</span>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar (only during processing) */}
      {isProcessing && (
        <div className="mb-2">
          <Progress value={session.progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">
            Processing... {session.progress}%
          </p>
        </div>
      )}

      {/* Status message */}
      {isCompleted && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-green-600 dark:text-green-400">
            Ready for review
          </p>
          <Link
            href={`/sessions/${session.sessionId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View Session
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {isFailed && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-red-600 dark:text-red-400">
            Processing failed
          </p>
          <Link
            href={`/sessions/${session.sessionId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View Session
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  )
}
