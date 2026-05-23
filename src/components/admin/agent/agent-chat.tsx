'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { fetchModels, streamAgent } from '@/services/agent-service'
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

export function AgentChat() {
  const [model, setModel] = useState<string>('claude-opus-4-7')
  const [models, setModels] = useState<ModelOption[]>([])
  const [messages, setMessages] = useState<AgentMessageType[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  // Captured from the SDK's first `session_init` event; sent back as
  // `resume_session_id` on follow-up turns so the agent keeps prior tool
  // history in working memory. Cleared by the "New" button.
  const [sdkSessionId, setSdkSessionId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Fetch model picker options once.
  useEffect(() => {
    let cancelled = false
    fetchModels()
      .then(res => {
        if (cancelled) return
        setModels(res.models)
        if (res.default) setModel(res.default)
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

  const handleReset = useCallback(() => {
    if (streaming) handleCancel()
    setMessages([])
    setSdkSessionId(null)
  }, [streaming, handleCancel])

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
          signal: controller.signal,
        })) {
          if (event.type === 'session_init' && event.session_id) {
            // Capture the SDK session id on the first turn; the next turn
            // sends it back as resume_session_id.
            setSdkSessionId(event.session_id)
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
      }
    },
    [input, model, messages, streaming, sdkSessionId],
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
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-lg border border-line-strong bg-paper shadow-sm">
      {/* Analyst console header — distinguishes this from regular chat. */}
      <div className="border-b border-line bg-surface-1">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ds-accent text-ink-on-dark shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-ink">
                Data Analyst Agent
              </span>
              <span className="rounded bg-ds-accent-bg px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ds-accent">
                Agent · Admin
              </span>
            </div>
            <span className="text-[11px] text-ink-3">
              Reasons across the live database and session transcripts. Strictly
              read-only.
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Select value={model} onValueChange={setModel} disabled={streaming}>
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
              onClick={handleReset}
              disabled={messages.length === 0}
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
                {userTurns} turn{userTurns === 1 ? '' : 's'} · {totalToolCalls}{' '}
                tool call
                {totalToolCalls === 1 ? '' : 's'}
              </span>
            ) : null}
          </span>
        </div>
      </div>

      {/* Live activity bar — only visible while streaming. */}
      <div className="px-4">
        <AgentActivityBar blocks={liveAssistantBlocks} streaming={streaming} />
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
  )
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ds-accent text-ink-on-dark shadow-md">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold text-ink">
        Ask the agent anything about your data
      </h2>
      <p className="mt-1.5 text-sm text-ink-3">
        Unlike the per-client chat, this agent reasons across <em>all</em>
        coaches, clients, sessions, and transcripts. It writes SQL, searches
        transcripts semantically, and builds charts — chaining steps as needed.
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
    case 'tool_result':
      return blocks.map(b => {
        if (b.kind !== 'tool_call' || b.id !== event.id) return b
        const isError =
          event.result &&
          typeof event.result === 'object' &&
          'error' in event.result
        return {
          ...b,
          result: event.result,
          status: isError ? 'error' : 'done',
        }
      })
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
