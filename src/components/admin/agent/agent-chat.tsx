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
import {
  Sparkles,
  RotateCcw,
  Database,
  MessagesSquare,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { AgentMessage } from './agent-message'
import { AgentComposer } from './agent-composer'
import { AgentActivityBar } from './agent-activity-bar'
import { AgentThreadSidebar } from './agent-thread-sidebar'
import { fetchModels, streamAgent } from '@/services/agent-service'
import { useAgentThread } from '@/hooks/queries/use-agent-threads'
import { queryKeys } from '@/lib/query-client'
import type {
  AgentEvent,
  AgentMessage as AgentMessageType,
  MessageBlock,
  ModelOption,
  ToolName,
} from '@/types/agent'

const STARTERS = [
  'How many active coaches do we have right now?',
  'Plot coaching sessions per week over the last 3 months.',
  'Find the top 5 coaches by avg coaching scores, then quote a moment of strong coaching from each.',
  'Top 5 most common primary goals across all client personas.',
  'Find 3 examples in our transcripts where a coach helps a client reframe a stuck mindset.',
  'Compare average session length for 1-on-1 vs group sessions.',
]

// Flip to `true` to bring back the thread-history UI (sidebar, ?thread= URL,
// refresh-hydration). Backend persistence runs regardless — rows keep being
// written to `agent_threads`; we just don't surface them.
const SHOW_THREAD_HISTORY = false

export function AgentChat() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // When the sidebar UI is on, the URL is the source-of-truth for "which
  // thread is open" so refresh / back-forward / share-URL round-trip cleanly.
  // When it's hidden, the id lives in component state only — follow-up turns
  // within the same conversation still get grouped on the server, but
  // refresh / bookmark / share won't surface the persistence layer.
  const urlThreadId = searchParams.get('thread')
  const [hiddenThreadId, setHiddenThreadId] = useState<string | null>(null)
  const threadId = SHOW_THREAD_HISTORY ? urlThreadId : hiddenThreadId

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
  const { data: hydratedThread } = useAgentThread(
    SHOW_THREAD_HISTORY ? threadId : null,
    {
      // We only need this on entry / navigation — once messages are local,
      // further updates come from the stream, not from re-fetching.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  )

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
    fetchModels()
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
  }, [])

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
    if (SHOW_THREAD_HISTORY) {
      // Strip ?thread=… without a navigation event so we stay on the page.
      router.replace(pathname, { scroll: false })
    }
  }, [streaming, handleCancel, router, pathname])

  const handleSelectThread = useCallback(
    (threadId: string) => {
      if (threadId === threadId) return
      if (streaming) handleCancel()
      // The useEffect above (keyed on threadId) does the hydration.
      router.replace(`${pathname}?thread=${threadId}`, { scroll: false })
    },
    [threadId, streaming, handleCancel, router, pathname],
  )

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
          signal: controller.signal,
        })) {
          if (event.type === 'session_init' && event.session_id) {
            setSdkSessionId(event.session_id)
          }
          if (event.type === 'thread_init') {
            loadedThreadIdRef.current = event.thread_id
            if (SHOW_THREAD_HISTORY) {
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
          queryKey: queryKeys.admin.agentThreads.list(),
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
      router,
      pathname,
      queryClient,
    ],
  )

  const showStarters = messages.length === 0 && !streaming

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
  const totalToolCalls = useMemo(
    () =>
      messages.reduce(
        (n, m) => n + m.blocks.filter(b => b.kind === 'tool_call').length,
        0,
      ),
    [messages],
  )
  const userTurns = useMemo(
    () => messages.filter(m => m.role === 'user').length,
    [messages],
  )

  return (
    <div className="flex h-full overflow-hidden border-0 bg-paper">
      {SHOW_THREAD_HISTORY ? (
        <AgentThreadSidebar
          activeThreadId={threadId}
          onSelectThread={handleSelectThread}
          onNewThread={handleNewThread}
        />
      ) : null}
      <div className="flex flex-1 min-w-0 flex-col">
        {/* Analyst console header — distinguishes this from regular chat. */}
        <div className="border-b border-line bg-surface-1">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ds-accent text-ink-on-dark shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-ink">
                  Sidekick Agent
                </span>
                <span className="rounded bg-ds-accent-bg px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ds-accent">
                  Admin
                </span>
              </div>
              <span className="text-[11px] text-ink-3">
                Queries the live database and session transcripts. Read-only.
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Select
                value={model}
                onValueChange={setModel}
                disabled={streaming}
              >
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  {/* Render only the model label in the trigger; the description
                    only belongs in the open menu. Passing children to SelectValue
                    overrides the default which would echo the full SelectItem
                    children (label + description) and overflow the row. */}
                  <SelectValue placeholder="Pick a model">
                    {modelOptions.find(m => m.id === model)?.label ?? model}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewThread}
                disabled={messages.length === 0 && !threadId}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New
              </Button>
            </div>
          </div>
          {/* Capability strip — surfaces what the agent has access to. */}
          <div className="flex items-center gap-3 border-t border-line bg-ds-accent-bg px-4 py-1.5 text-[11px] text-ink-2">
            <span className="inline-flex items-center gap-1">
              <Database className="h-3 w-3" />
              Postgres
            </span>
            <span className="inline-flex items-center gap-1">
              <MessagesSquare className="h-3 w-3" />
              Transcripts (Weaviate)
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Charts
            </span>
            <span className="inline-flex items-center gap-1 text-forest">
              <ShieldCheck className="h-3 w-3" />
              Read-only
            </span>
            <span className="ml-auto flex items-center gap-3 font-mono text-[10px] text-ink-3">
              {sdkSessionId ? (
                <span title={sdkSessionId}>
                  session {sdkSessionId.slice(0, 8)}…
                </span>
              ) : null}
              {userTurns > 0 ? (
                <span>
                  {userTurns} turn{userTurns === 1 ? '' : 's'} ·{' '}
                  {totalToolCalls} tool call
                  {totalToolCalls === 1 ? '' : 's'}
                </span>
              ) : null}
            </span>
          </div>
        </div>

        {/* Live activity bar — only visible while streaming. */}
        <div className="px-4">
          <AgentActivityBar
            blocks={liveAssistantBlocks}
            streaming={streaming}
          />
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto flex max-w-4xl flex-col gap-4">
            {showStarters ? (
              <EmptyState onPick={q => handleSend(q)} />
            ) : (
              messages.map(m => <AgentMessage key={m.id} message={m} />)
            )}
          </div>
        </div>

        <AgentComposer
          value={input}
          onChange={setInput}
          onSend={() => handleSend()}
          onCancel={handleCancel}
          streaming={streaming}
        />
      </div>
    </div>
  )
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ds-accent text-ink-on-dark shadow-md">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold text-ink">
        Ask Sidekick anything about your data
      </h2>
      <p className="mt-1.5 text-sm text-ink-3">
        Reasons across every coach, client, session, and transcript — writing
        SQL, searching transcripts, and building charts as needed.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {STARTERS.map(q => (
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
