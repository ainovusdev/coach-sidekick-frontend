'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MessageBlock, ToolName } from '@/types/agent'

/**
 * Live status bar shown while the agent is mid-thought. Sits at the top of
 * the streaming assistant turn and updates with the current tool's intent.
 *
 * Purpose: make it instantly obvious this isn't a chatbot — it's an agent
 * that's actively running queries, searching transcripts, and composing
 * answers across many steps.
 */

interface Props {
  /** Blocks of the currently-streaming assistant message. Most-recent last. */
  blocks: MessageBlock[]
  /** Whether the stream is still active. */
  streaming: boolean
}

const TOOL_VERB: Record<ToolName, string> = {
  run_sql_query: 'Running SQL',
  describe_schema: 'Inspecting schema',
  generate_chart: 'Rendering chart',
  search_conversations: 'Searching transcripts',
  get_session_transcript: 'Reading transcript',
  generate_report: 'Composing PDF report',
}

export function AgentActivityBar({ blocks, streaming }: Props) {
  if (!streaming) return null

  const status = deriveStatus(blocks)
  if (!status) return null

  return (
    <div className="mx-auto mt-2 flex max-w-4xl items-center gap-2 rounded-md border border-line bg-ds-accent-bg px-3 py-1.5 text-xs text-ink-2 shadow-sm">
      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ds-accent" />
      <span className="font-medium text-ink">{status.verb}</span>
      {status.detail ? (
        <span className="truncate text-ink-3">{status.detail}</span>
      ) : null}
      {status.stepLabel ? (
        <span className="ml-auto shrink-0 rounded bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ds-accent">
          {status.stepLabel}
        </span>
      ) : null}
    </div>
  )
}

interface DerivedStatus {
  verb: string
  detail: string | null
  stepLabel: string | null
}

function deriveStatus(blocks: MessageBlock[]): DerivedStatus | null {
  if (blocks.length === 0) {
    return { verb: 'Thinking', detail: null, stepLabel: null }
  }

  // The most recent running tool dominates the status.
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i]
    if (b.kind === 'tool_call' && b.status === 'running') {
      return {
        verb: TOOL_VERB[b.name] ?? b.name,
        detail: extractToolDetail(b),
        stepLabel: buildStepLabel(blocks),
      }
    }
  }

  // No running tool — find the last completed tool, otherwise we're composing text.
  const lastCompleted = [...blocks]
    .reverse()
    .find(b => b.kind === 'tool_call' && b.status === 'done')
  if (lastCompleted && lastCompleted.kind === 'tool_call') {
    return {
      verb: 'Composing answer',
      detail: `after ${TOOL_VERB[lastCompleted.name] ?? lastCompleted.name}`,
      stepLabel: buildStepLabel(blocks),
    }
  }

  // No tools yet — probably text streaming or thinking.
  return { verb: 'Composing answer', detail: null, stepLabel: null }
}

function extractToolDetail(
  block: Extract<MessageBlock, { kind: 'tool_call' }>,
): string | null {
  const input = block.input
  // Prefer the model-supplied explanation when present.
  if (typeof input.explanation === 'string' && input.explanation.trim()) {
    return input.explanation.trim()
  }
  if (block.name === 'run_sql_query') {
    const q = (input.query as string | undefined) || block.partialInput
    return q ? truncate(q.replace(/\s+/g, ' '), 100) : null
  }
  if (block.name === 'describe_schema') {
    const table = (input.table as string | undefined) || 'all tables'
    return `for ${table}`
  }
  if (block.name === 'search_conversations') {
    const q = (input.query as string | undefined) || null
    if (!q) return null
    const scope = input.coach_id
      ? ' (one coach)'
      : input.client_id
        ? ' (one client)'
        : ''
    return `"${truncate(q, 80)}"${scope}`
  }
  if (block.name === 'get_session_transcript') {
    const id = (input.session_id as string | undefined) || ''
    return id ? `session ${id.slice(0, 8)}…` : null
  }
  if (block.name === 'generate_chart') {
    const title = (input.title as string | undefined) || null
    return title ? truncate(title, 80) : null
  }
  if (block.name === 'generate_report') {
    const title = (input.title as string | undefined) || null
    return title ? truncate(title, 80) : null
  }
  return null
}

function buildStepLabel(blocks: MessageBlock[]): string | null {
  const total = blocks.filter(b => b.kind === 'tool_call').length
  if (total === 0) return null
  return `Step ${total}`
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}

// `cn` is imported above but our minimal class strings don't need it; keeping
// the import so future variants can use it without re-adding.
void cn
