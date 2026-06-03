'use client'

import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Database,
  FileDown,
  FileText,
  Loader2,
  MessagesSquare,
  Search,
} from 'lucide-react'
import type { MessageBlock, ToolName } from '@/types/agent'

// Plain-language, jargon-free headlines for coaches/clients. They see only WHAT
// the agent is doing ("Searching your coaching data"), never the SQL, schema, or
// raw rows — those stay on the admin console via <AgentToolCallCard>.
const TOOL_HEADLINE: Record<
  ToolName,
  { running: string; done: string; icon: typeof Database }
> = {
  run_sql_query: {
    running: 'Searching your coaching data',
    done: 'Searched your coaching data',
    icon: Search,
  },
  describe_schema: {
    running: 'Getting oriented',
    done: 'Got oriented',
    icon: BookOpen,
  },
  generate_chart: {
    running: 'Building a chart',
    done: 'Built a chart',
    icon: BarChart3,
  },
  generate_static_chart: {
    running: 'Building a chart',
    done: 'Built a chart',
    icon: BarChart3,
  },
  search_conversations: {
    running: 'Searching your conversations',
    done: 'Searched your conversations',
    icon: MessagesSquare,
  },
  get_session_transcript: {
    running: 'Reading a session transcript',
    done: 'Read a session transcript',
    icon: FileText,
  },
  generate_report: {
    running: 'Preparing a report',
    done: 'Prepared a report',
    icon: FileDown,
  },
}

interface Props {
  block: Extract<MessageBlock, { kind: 'tool_call' }>
}

/**
 * Compact, read-only "what's happening" line shown to coaches and clients in
 * place of the full tool-call card. No SQL, no result tables, not expandable.
 */
export function AgentToolCallHeadline({ block }: Props) {
  const meta = TOOL_HEADLINE[block.name]
  const isError =
    block.status === 'error' ||
    (block.result &&
      typeof block.result === 'object' &&
      'error' in block.result)

  const running = block.status === 'running'
  const Icon = meta?.icon ?? Database
  const label = isError
    ? 'Couldn’t complete that step'
    : running
      ? (meta?.running ?? 'Working on it')
      : (meta?.done ?? 'Done')

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-ink-3">
      {running ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      ) : isError ? (
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-token" />
      ) : (
        <Icon className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </div>
  )
}
