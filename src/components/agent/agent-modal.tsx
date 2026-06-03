'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AgentApiScope } from '@/services/agent-service'

// Lazy-loaded: the agent pulls in the markdown renderer, Recharts, chart cards,
// etc. Since this provider lives at the app root, a static import would bundle all
// of that into every route (login, client portal…). Loading on first open keeps
// the base bundle light; the dialog only mounts its content while open anyway.
const AgentChat = dynamic(
  () => import('@/components/admin/agent/agent-chat').then(m => m.AgentChat),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-paper">
        <Loader2 className="h-5 w-5 animate-spin text-ds-accent" />
      </div>
    ),
  },
)

interface OpenAgentOptions {
  /** Agent data scope. Defaults to the provider's `defaultScope`. */
  scope?: AgentApiScope
  /** Ask this question immediately in a fresh conversation. */
  query?: string
  /** Open a specific saved conversation instead of starting fresh. */
  threadId?: string
}

interface AgentModalContextValue {
  openAgent: (opts?: OpenAgentOptions) => void
  closeAgent: () => void
  isOpen: boolean
}

const AgentModalContext = createContext<AgentModalContextValue | null>(null)

export function useAgentModal(): AgentModalContextValue {
  const ctx = useContext(AgentModalContext)
  if (!ctx) {
    throw new Error('useAgentModal must be used within an AgentModalProvider')
  }
  return ctx
}

/**
 * App-level provider for the Sidekick Agent modal. Any descendant can call
 * `useAgentModal().openAgent(...)` to pop the agent open as a large on-page
 * dialog — no navigation, so the user keeps their place. The dedicated full page
 * is reached only by the explicit "Open full page" control inside the modal.
 *
 * Mounted once near the app root; the dialog content (and its data fetching)
 * only mounts while the modal is open.
 */
export function AgentModalProvider({
  children,
  defaultScope = 'coach',
}: {
  children: ReactNode
  defaultScope?: AgentApiScope
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<AgentApiScope>(defaultScope)
  const [initialQuery, setInitialQuery] = useState<string | undefined>(
    undefined,
  )
  const [initialThreadId, setInitialThreadId] = useState<string | undefined>(
    undefined,
  )
  // Bumped on every open so AgentChat remounts fresh.
  const [mountKey, setMountKey] = useState(0)

  const openAgent = useCallback((opts: OpenAgentOptions = {}) => {
    if (opts.scope) setScope(opts.scope)
    // Always (re)seed + remount so every open is deterministic: a question, a
    // saved thread, or — with neither — a fresh *empty* modal (clearing any seed
    // left over from a prior open). Radix unmounts the content on close, so there's
    // no in-memory conversation to preserve anyway.
    setInitialQuery(opts.query)
    setInitialThreadId(opts.threadId)
    setMountKey(k => k + 1)
    setOpen(true)
  }, [])

  const closeAgent = useCallback(() => setOpen(false), [])

  // Close on route change — "Open full page" navigates away, and clicking any nav
  // link while the modal is open should dismiss it rather than leave it floating.
  const prevPathRef = useRef(pathname)
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname
      setOpen(false)
    }
  }, [pathname])

  return (
    <AgentModalContext.Provider value={{ openAgent, closeAgent, isOpen: open }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex h-[95vh] w-[97vw] max-w-[1800px] flex-col gap-0 overflow-hidden rounded-2xl border border-line bg-paper p-0 shadow-2xl"
          // The agent owns its own composer focus; don't let the dialog steal the
          // first focus to a header icon button instead.
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Sidekick Agent</DialogTitle>
          <DialogDescription className="sr-only">
            Ask Sidekick about your clients, sessions, transcripts, and scores.
          </DialogDescription>
          <AgentChat
            key={mountKey}
            apiScope={scope}
            variant="modal"
            initialQuery={initialQuery}
            initialThreadId={initialThreadId}
            onClose={closeAgent}
          />
        </DialogContent>
      </Dialog>
    </AgentModalContext.Provider>
  )
}
