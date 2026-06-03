'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Sparkles, RotateCcw, Maximize2, X } from 'lucide-react'
import { AgentMessage } from './agent-message'
import { AgentComposer } from './agent-composer'
import { AgentActivityBar } from './agent-activity-bar'
import { AgentThreadSidebar } from './agent-thread-sidebar'
import {
  fetchModels,
  streamAgent,
  type AgentApiScope,
} from '@/services/agent-service'
import {
  agentThreadKeys,
  useAgentThread,
} from '@/hooks/queries/use-agent-threads'
import type {
  AgentEvent,
  AgentMessage as AgentMessageType,
  MessageBlock,
  ModelOption,
  ToolName,
} from '@/types/agent'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AgentThreadMenu } from './agent-thread-menu'
import { STARTERS_BY_SCOPE, EMPTY_STATE_BLURB } from './agent-starters'

const SCOPE_BADGE: Record<AgentApiScope, string> = {
  admin: 'Admin',
  coach: 'Coach',
  client: 'You',
}

// Short, reassuring status line shown under the conversation title when idle.
const HEADER_STATUS: Record<AgentApiScope, string> = {
  admin: 'Read-only access',
  coach: 'Private · reads only your data',
  client: 'Private · reads only your data',
}

export interface AgentChatProps {
  /** Which backend agent mount to use. Drives data scope + starters + badge. */
  apiScope?: AgentApiScope
  /**
   * 'full' (default) = dedicated page: left sidebar + ?thread= URL persistence.
   * 'embedded' = dashboard card: popover history + local thread state + card chrome.
   * 'modal' = large on-page dialog: like embedded, but the Dialog owns the chrome
   *   and the header gains a Close button (wired to `onClose`).
   */
  variant?: 'full' | 'embedded' | 'modal'
  /** Auto-asked once on mount (deep-link from the "Ask Sidekick" bar / card). */
  initialQuery?: string
  /** Seed the conversation to a saved thread on mount (compact modes only). */
  initialThreadId?: string
  /** Modal mode: called by the Close button and after "Open full page" navigates. */
  onClose?: () => void
}

export function AgentChat({
  apiScope = 'admin',
  variant = 'full',
  initialQuery,
  initialThreadId,
  onClose,
}: AgentChatProps = {}) {
  // The dedicated page ('full') and the near-fullscreen 'modal' both show the left
  // thread sidebar; only the small dashboard card ('embedded') is too narrow, so it
  // hides the sidebar and surfaces history via a popover in a slim header instead.
  // The active thread is held in local state (not the URL) for modal + embedded, so
  // the host page's address bar is never rewritten; only 'full' treats ?thread= as
  // the source of truth. Backend persistence runs in every mode.
  const isModal = variant === 'modal'
  const isEmbedded = variant === 'embedded'
  const showSidebar = variant === 'full' || isModal
  const persistThreadInUrl = variant === 'full'
  // The dashboard card draws its own border/shadow; the modal's Dialog supplies the
  // chrome, and the full page is edge-to-edge — so only 'embedded' is chromed.
  const showCardChrome = isEmbedded
  // Only the narrow dashboard card uses the slim icon-button header; the roomy modal
  // uses the same full console header as the dedicated page (plus Close controls).
  const slimHeader = isEmbedded

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const starters = STARTERS_BY_SCOPE[apiScope]

  // When the sidebar UI is on, the URL is the source-of-truth for "which
  // thread is open" so refresh / back-forward / share-URL round-trip cleanly.
  // When it's hidden, the id lives in component state only — follow-up turns
  // within the same conversation still get grouped on the server, but
  // refresh / bookmark / share won't surface the persistence layer.
  const urlThreadId = searchParams.get('thread')
  // Deep-link query: in full (URL) mode the "Ask Sidekick" bar / card lands here
  // with ?q=<question>; embedded mode passes the question via the prop instead.
  const urlQuery = persistThreadInUrl ? searchParams.get('q') : null
  const [hiddenThreadId, setHiddenThreadId] = useState<string | null>(
    initialThreadId ?? null,
  )
  const threadId = persistThreadInUrl ? urlThreadId : hiddenThreadId

  const [model, setModel] = useState<string>('claude-opus-4-7')
  const [models, setModels] = useState<ModelOption[]>([])
  const [messages, setMessages] = useState<AgentMessageType[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  // Captured from the SDK's first `session_init` event; sent back as
  // `resume_session_id` on follow-up turns so the agent's cached subprocess
  // (or a fresh-spawn fallback) reattaches to prior tool history.
  const [sdkSessionId, setSdkSessionId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Hydration: if the URL points at a thread we haven't loaded, fetch it and
  // replace local message state with the persisted version.
  const { data: hydratedThread } = useAgentThread(threadId, apiScope, {
    // We only need this on entry / navigation (URL ?thread= or a popover pick) —
    // once messages are local, further updates come from the stream.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  // Track which thread the local state belongs to so we don't re-hydrate
  // over a fresh-streamed conversation.
  const loadedThreadIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!threadId) {
      // URL cleared — caller hit "New chat". Reset to empty state.
      if (loadedThreadIdRef.current !== null) {
        setMessages([])
        setSdkSessionId(null)
        loadedThreadIdRef.current = null
      }
      return
    }
    if (loadedThreadIdRef.current === threadId) return
    if (!hydratedThread) return
    setMessages(hydratedThread.messages ?? [])
    setModel(hydratedThread.model)
    setSdkSessionId(null) // Cold load — let the server build a fresh SDK session.
    loadedThreadIdRef.current = threadId
  }, [threadId, hydratedThread])

  // Fetch model picker options once.
  useEffect(() => {
    let cancelled = false
    fetchModels(apiScope)
      .then(res => {
        if (cancelled) return
        setModels(res.models)
        // Only overwrite the picker default if we're not in a loaded thread
        // (loaded threads carry their own last-used model).
        if (res.default && !loadedThreadIdRef.current) setModel(res.default)
      })
      .catch(err => {
        if (cancelled) return
        // Non-fatal — the picker stays at its default.
        console.warn('Failed to fetch agent models', err)
      })
    return () => {
      cancelled = true
    }
  }, [apiScope])

  // Auto-scroll to bottom as messages grow.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  })

  const handleCancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
  }, [])

  const handleNewThread = useCallback(() => {
    if (streaming) handleCancel()
    setMessages([])
    setSdkSessionId(null)
    setHiddenThreadId(null)
    loadedThreadIdRef.current = null
    if (persistThreadInUrl) {
      // Strip ?thread=… without a navigation event so we stay on the page.
      router.replace(pathname, { scroll: false })
    }
  }, [streaming, handleCancel, router, pathname, persistThreadInUrl])

  const handleSelectThread = useCallback(
    (nextThreadId: string) => {
      if (nextThreadId === threadId) return
      if (streaming) handleCancel()
      // The useEffect above (keyed on threadId) does the hydration.
      if (persistThreadInUrl) {
        router.replace(`${pathname}?thread=${nextThreadId}`, { scroll: false })
      } else {
        setHiddenThreadId(nextThreadId)
      }
    },
    [threadId, streaming, handleCancel, router, pathname, persistThreadInUrl],
  )

  // Compact → full page, carrying the current conversation (threads are
  // server-persisted, so the dedicated page hydrates the same messages). In modal
  // mode we also dismiss the dialog so we don't navigate behind an open overlay.
  const handleExpand = useCallback(() => {
    const full = fullRouteForScope(apiScope)
    router.push(threadId ? `${full}?thread=${threadId}` : full)
    onClose?.()
  }, [apiScope, threadId, router, onClose])

  const handleSend = useCallback(
    async (questionOverride?: string) => {
      const question = (questionOverride ?? input).trim()
      if (!question || streaming) return

      const userMsg: AgentMessageType = {
        id: crypto.randomUUID(),
        role: 'user',
        blocks: [{ kind: 'text', text: question }],
      }
      const assistantMsg: AgentMessageType = {
        id: crypto.randomUUID(),
        role: 'assistant',
        blocks: [],
      }
      const historyForBackend = buildBackendHistory([...messages, userMsg])

      setMessages(prev => [...prev, userMsg, assistantMsg])
      setInput('')
      setStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        for await (const event of streamAgent({
          messages: historyForBackend,
          model,
          resume_session_id: sdkSessionId,
          thread_id: threadId,
          scope: apiScope,
          signal: controller.signal,
        })) {
          if (event.type === 'session_init' && event.session_id) {
            setSdkSessionId(event.session_id)
          }
          if (event.type === 'thread_init') {
            loadedThreadIdRef.current = event.thread_id
            if (persistThreadInUrl) {
              // Brand-new thread — pin it to the URL so reload / share works.
              router.replace(`${pathname}?thread=${event.thread_id}`, {
                scroll: false,
              })
            } else {
              // Sidebar hidden — keep the id in state so follow-up turns still
              // get grouped server-side, without exposing it in the URL.
              setHiddenThreadId(event.thread_id)
            }
          }
          setMessages(prev => applyEvent(prev, assistantMsg.id, event))
          if (event.type === 'done') break
        }
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string }
        if (err.name === 'AbortError') {
          // Silent — user pressed Stop.
        } else {
          const message = err.message || 'Agent request failed'
          toast.error('Agent error', { description: message })
          setMessages(prev =>
            applyEvent(prev, assistantMsg.id, {
              type: 'error',
              message,
            } as AgentEvent),
          )
        }
      } finally {
        abortRef.current = null
        setStreaming(false)
        // Refresh the sidebar so the just-touched thread floats to the top
        // and its "last activity" timestamp is current.
        queryClient.invalidateQueries({
          queryKey: agentThreadKeys.list(apiScope),
        })
      }
    },
    [
      input,
      model,
      messages,
      streaming,
      sdkSessionId,
      threadId,
      apiScope,
      router,
      pathname,
      queryClient,
      persistThreadInUrl,
    ],
  )

  // Deep-link: if launched with an initial question (the `initialQuery` prop or
  // ?q= in the URL, from the "Ask Sidekick" bar / card), ask it once on mount.
  // Ref-guarded against StrictMode double-run.
  const initialQueryFiredRef = useRef(false)
  useEffect(() => {
    if (initialQueryFiredRef.current) return
    const q = (initialQuery ?? urlQuery ?? '').trim()
    if (!q) return
    if (messages.length > 0 || threadId) return
    initialQueryFiredRef.current = true
    void handleSend(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, urlQuery])

  const showStarters = messages.length === 0 && !streaming

  // The active conversation's title for the header: the saved thread's title once
  // hydrated, else the first user message (a good stand-in for a fresh chat),
  // else null (brand-new, nothing asked yet).
  const activeThreadTitle = useMemo<string | null>(() => {
    if (hydratedThread?.id === threadId && hydratedThread?.title) {
      return hydratedThread.title
    }
    const firstUser = messages.find(m => m.role === 'user')
    const textBlock = firstUser?.blocks.find(b => b.kind === 'text')
    const text = textBlock && textBlock.kind === 'text' ? textBlock.text : ''
    return text.trim() || null
  }, [hydratedThread, threadId, messages])

  const modelOptions = useMemo<ModelOption[]>(() => {
    if (models.length > 0) return models
    return [
      {
        id: 'claude-opus-4-7',
        label: 'Claude Opus 4.7',
        description: 'Strongest reasoning',
      },
    ]
  }, [models])

  // The blocks of the latest assistant message — feed to the activity bar so
  // it knows what tool is currently running.
  const liveAssistantBlocks: MessageBlock[] =
    streaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant'
      ? messages[messages.length - 1].blocks
      : []

  return (
    <div
      className={cn(
        'flex h-full overflow-hidden bg-paper',
        showCardChrome ? 'rounded-xl border border-line shadow-sm' : 'border-0',
      )}
    >
      {showSidebar ? (
        <AgentThreadSidebar
          apiScope={apiScope}
          activeThreadId={threadId}
          onSelectThread={handleSelectThread}
          onNewThread={handleNewThread}
        />
      ) : null}
      <div className="flex flex-1 min-w-0 flex-col">
        {slimHeader ? (
          /* Slim header for the narrow dashboard card — history in a popover, no
             model picker or capability strip, with an Expand-to-full control. */
          <div className="flex items-center gap-2.5 border-b border-line bg-surface-1 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ds-accent text-ink-on-dark shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold tracking-tight text-ink">
                Sidekick Agent
              </span>
              <span className="rounded bg-ds-accent-bg px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ds-accent">
                {SCOPE_BADGE[apiScope]}
              </span>
            </div>
            <TooltipProvider delayDuration={300}>
              <div className="ml-auto flex items-center gap-0.5">
                <AgentThreadMenu
                  apiScope={apiScope}
                  activeThreadId={threadId}
                  onSelectThread={handleSelectThread}
                  onNewThread={handleNewThread}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleNewThread}
                      disabled={messages.length === 0 && !threadId}
                      aria-label="New conversation"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New conversation</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleExpand}
                      aria-label="Expand to full view"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Expand to full view</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        ) : (
          /* Console header — conversation-title-centric and calm. The Read-only
             reassurance now lives in the status line + composer; "New" lives in the
             sidebar. Modal mode adds Open-full-page + Close on the right. */
          <div className="flex items-center gap-3 border-b border-line bg-surface-1 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ds-accent text-ink-on-dark shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold tracking-tight text-ink">
                  {activeThreadTitle ?? 'Sidekick Agent'}
                </span>
                {!activeThreadTitle ? (
                  <span className="shrink-0 rounded bg-ds-accent-bg px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ds-accent">
                    {SCOPE_BADGE[apiScope]}
                  </span>
                ) : null}
              </div>
              <span className="flex items-center gap-1.5 text-[11px] text-ink-3">
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full bg-forest',
                    streaming && 'animate-pulse',
                  )}
                />
                <span className="truncate">
                  {streaming ? 'Working…' : HEADER_STATUS[apiScope]}
                </span>
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              {/* Model switching is a power-user control — keep it for coaches/
                  admins, hide it from the client portal, and quiet the styling. */}
              {apiScope !== 'client' ? (
                <Select
                  value={model}
                  onValueChange={setModel}
                  disabled={streaming}
                >
                  <SelectTrigger className="h-8 w-auto gap-1.5 border-line bg-paper px-2.5 text-xs text-ink-2">
                    {/* Render only the (shortened) model label in the trigger; the
                    description belongs in the open menu. Passing children to
                    SelectValue overrides the default which would echo the full
                    SelectItem children and overflow the row. */}
                    <SelectValue placeholder="Model">
                      {shortModelLabel(
                        modelOptions.find(m => m.id === model)?.label ?? model,
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map(m => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        <div className="flex flex-col">
                          <span>{m.label}</span>
                          <span className="text-[10px] text-ink-3">
                            {m.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              {isModal ? (
                /* Modal-only: an explicit Open-full-page escape hatch (URL-persisted,
                   shareable) and a Close button. Native titles avoid wrapping this
                   row in a TooltipProvider. */
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleExpand}
                    aria-label="Open full page"
                    title="Open full page"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onClose}
                    aria-label="Close"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* Live activity bar — only visible while streaming. */}
        <div className="px-4">
          <AgentActivityBar
            blocks={liveAssistantBlocks}
            streaming={streaming}
            apiScope={apiScope}
          />
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto flex max-w-4xl flex-col gap-4">
            {showStarters ? (
              <EmptyState
                onPick={q => handleSend(q)}
                starters={starters}
                apiScope={apiScope}
              />
            ) : (
              messages.map(m => (
                <AgentMessage key={m.id} message={m} apiScope={apiScope} />
              ))
            )}
          </div>
        </div>

        <AgentComposer
          value={input}
          onChange={setInput}
          onSend={() => handleSend()}
          onCancel={handleCancel}
          streaming={streaming}
          autoFocus={isModal}
          apiScope={apiScope}
        />
      </div>
    </div>
  )
}

function EmptyState({
  onPick,
  starters,
  apiScope,
}: {
  onPick: (q: string) => void
  starters: string[]
  apiScope: AgentApiScope
}) {
  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ds-accent text-ink-on-dark shadow-md">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold text-ink">Ask Sidekick anything</h2>
      <p className="mt-1.5 text-sm text-ink-3">{EMPTY_STATE_BLURB[apiScope]}</p>
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {starters.map(q => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="group rounded-lg border border-line bg-paper px-3 py-2 text-left text-xs text-ink-2 transition hover:-translate-y-px hover:border-line-strong hover:bg-ds-accent-bg hover:text-ink hover:shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Drop the "Claude " prefix so the picker reads "Opus 4.7", not "Claude Opus 4.7". */
function shortModelLabel(label: string): string {
  return label.replace(/^Claude\s+/i, '')
}

/** The dedicated full-page route for each scope — where "Expand" sends you. */
function fullRouteForScope(scope: AgentApiScope): string {
  switch (scope) {
    case 'client':
      return '/client-portal/agent'
    case 'coach':
      return '/agent'
    default:
      return '/admin/agent'
  }
}

// ---------------------------------------------------------------------------
// State reduction: turn streamed AgentEvents into the message block tree.
// ---------------------------------------------------------------------------

function applyEvent(
  messages: AgentMessageType[],
  assistantId: string,
  event: AgentEvent,
): AgentMessageType[] {
  return messages.map(m => {
    if (m.id !== assistantId) return m
    // The `done` event carries metrics; stash them on the message for the footer.
    if (event.type === 'done' && event.metrics) {
      return {
        ...m,
        metrics: event.metrics,
        blocks: reduceBlocks(m.blocks, event),
      }
    }
    return { ...m, blocks: reduceBlocks(m.blocks, event) }
  })
}

function reduceBlocks(
  blocks: MessageBlock[],
  event: AgentEvent,
): MessageBlock[] {
  switch (event.type) {
    case 'assistant_text_delta': {
      const last = blocks[blocks.length - 1]
      if (last && last.kind === 'text') {
        const updated = { ...last, text: last.text + event.text }
        return [...blocks.slice(0, -1), updated]
      }
      return [...blocks, { kind: 'text', text: event.text }]
    }
    case 'tool_use_start':
      return [
        ...blocks,
        {
          kind: 'tool_call',
          id: event.id,
          name: event.name as ToolName,
          input: {},
          partialInput: '',
          status: 'running',
        },
      ]
    case 'tool_input_delta':
      return blocks.map(b =>
        b.kind === 'tool_call' && b.id === event.id
          ? { ...b, partialInput: b.partialInput + event.partial_json }
          : b,
      )
    case 'tool_use_end':
      return blocks.map(b =>
        b.kind === 'tool_call' && b.id === event.id
          ? { ...b, input: event.input || {} }
          : b,
      )
    case 'tool_result': {
      const isError =
        event.result &&
        typeof event.result === 'object' &&
        'error' in event.result
      const matching = blocks.find(
        b => b.kind === 'tool_call' && b.id === event.id,
      )
      const updated = blocks.map(b => {
        if (b.kind !== 'tool_call' || b.id !== event.id) return b
        return {
          ...b,
          result: event.result,
          status: isError ? 'error' : 'done',
        } as MessageBlock
      })
      if (
        !isError &&
        matching?.kind === 'tool_call' &&
        matching.name === 'generate_report' &&
        event.result &&
        typeof event.result === 'object' &&
        'url' in event.result &&
        typeof (event.result as { url?: unknown }).url === 'string'
      ) {
        const r = event.result as {
          url: string
          filename: string
          title: string
          size_bytes: number
          page_count: number
          expires_at: string
        }
        return [
          ...updated,
          {
            kind: 'report',
            spec: {
              url: r.url,
              filename: r.filename,
              title: r.title,
              size_bytes: r.size_bytes,
              page_count: r.page_count,
              expires_at: r.expires_at,
            },
          } as MessageBlock,
        ]
      }
      return updated
    }
    case 'chart':
      return [...blocks, { kind: 'chart', spec: event.spec }]
    case 'rendered_chart':
      return [
        ...blocks,
        {
          kind: 'svg_chart',
          svg: event.svg,
          title: event.title,
          description: event.description,
          error: event.error,
        },
      ]
    case 'error':
      return [
        ...blocks,
        { kind: 'text', text: `\n\n_Error: ${event.message}_` },
      ]
    case 'session_init':
    case 'assistant_thinking':
    case 'message_start':
    case 'message_stop':
    case 'done':
    default:
      return blocks
  }
}

/**
 * Convert UI message history to the {role, content} pairs the backend expects.
 * Assistant messages send only their concatenated text (we don't replay tool
 * exchanges across turns — that happens within a single request's agent loop).
 */
function buildBackendHistory(
  messages: AgentMessageType[],
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const out: Array<{ role: 'user' | 'assistant'; content: string }> = []
  for (const m of messages) {
    if (m.role === 'user') {
      const text = m.blocks
        .filter(b => b.kind === 'text')
        .map(b => (b as { kind: 'text'; text: string }).text)
        .join('\n')
      if (text.trim()) out.push({ role: 'user', content: text })
    } else {
      const text = m.blocks
        .filter(b => b.kind === 'text')
        .map(b => (b as { kind: 'text'; text: string }).text)
        .join('\n')
      // Skip empty placeholder assistant turns (e.g. the one we're streaming into).
      if (text.trim()) out.push({ role: 'assistant', content: text })
    }
  }
  return out
}
