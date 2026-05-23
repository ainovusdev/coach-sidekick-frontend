'use client'

import { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  Loader2,
  Database,
  BookOpen,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  MessagesSquare,
  FileText,
} from 'lucide-react'
import type {
  MessageBlock,
  SqlResult,
  ToolName,
  ToolResultPayload,
} from '@/types/agent'

const TOOL_META: Record<ToolName, { label: string; icon: typeof Database }> = {
  run_sql_query: { label: 'SQL query', icon: Database },
  describe_schema: { label: 'Schema lookup', icon: BookOpen },
  generate_chart: { label: 'Chart', icon: BarChart3 },
  search_conversations: { label: 'Conversation search', icon: MessagesSquare },
  get_session_transcript: { label: 'Session transcript', icon: FileText },
}

interface Props {
  block: Extract<MessageBlock, { kind: 'tool_call' }>
}

export function AgentToolCallCard({ block }: Props) {
  const meta = TOOL_META[block.name] ?? {
    label: block.name,
    icon: Database,
  }
  const Icon = meta.icon
  const [open, setOpen] = useState(false)

  const isError =
    block.status === 'error' ||
    (block.result &&
      typeof block.result === 'object' &&
      'error' in block.result)

  const statusBadge = (() => {
    if (block.status === 'running') {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running
        </Badge>
      )
    }
    if (isError) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Done
      </Badge>
    )
  })()

  return (
    <div className="my-2 rounded-lg border border-line bg-surface-1">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-2/50">
          <ChevronRight
            className={cn(
              'h-4 w-4 text-ink-3 transition-transform',
              open && 'rotate-90',
            )}
          />
          <Icon className="h-4 w-4 text-ink-3" />
          <span className="text-sm font-medium text-ink">{meta.label}</span>
          <span className="ml-auto flex items-center gap-2">
            <ToolInputSummary block={block} />
            {statusBadge}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-line px-3 py-3">
          <ToolInputDetails block={block} />
          {block.result ? <ToolResultDetails result={block.result} /> : null}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function ToolInputSummary({
  block,
}: {
  block: Extract<MessageBlock, { kind: 'tool_call' }>
}) {
  if (block.name === 'run_sql_query') {
    const explanation = (block.input.explanation as string) || ''
    return (
      <span className="hidden md:inline text-xs text-ink-3 truncate max-w-[40ch]">
        {explanation || '…'}
      </span>
    )
  }
  if (block.name === 'describe_schema') {
    const table = (block.input.table as string) || 'all tables'
    return <span className="text-xs text-ink-3">{table}</span>
  }
  if (block.name === 'generate_chart') {
    const title = (block.input.title as string) || ''
    return (
      <span className="hidden md:inline text-xs text-ink-3 truncate max-w-[40ch]">
        {title}
      </span>
    )
  }
  return null
}

function ToolInputDetails({
  block,
}: {
  block: Extract<MessageBlock, { kind: 'tool_call' }>
}) {
  if (block.name === 'run_sql_query') {
    const query = (block.input.query as string) || block.partialInput
    return (
      <div className="space-y-2">
        {block.input.explanation ? (
          <p className="text-xs text-ink-2">
            {block.input.explanation as string}
          </p>
        ) : null}
        <pre className="overflow-x-auto rounded bg-surface-2 p-2 text-xs text-ink whitespace-pre-wrap break-words">
          {query || '...'}
        </pre>
      </div>
    )
  }
  return (
    <pre className="overflow-x-auto rounded bg-surface-2 p-2 text-xs text-ink whitespace-pre-wrap break-words">
      {JSON.stringify(block.input, null, 2) || block.partialInput || '...'}
    </pre>
  )
}

function ToolResultDetails({ result }: { result: ToolResultPayload }) {
  if (!result || typeof result !== 'object') return null
  if ('error' in result) {
    return (
      <div className="mt-3 rounded border border-vermillion/40 bg-vermillion/10 p-2 text-xs text-vermillion">
        <strong className="font-medium">
          {(result as { error: string }).error}:
        </strong>{' '}
        {(result as { message?: string }).message}
      </div>
    )
  }
  if ('columns' in result && 'rows' in result) {
    return <SqlResultTable result={result as SqlResult} />
  }
  if ('description' in result) {
    return (
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded bg-surface-2 p-2 text-xs text-ink">
        {(result as { description: string }).description}
      </pre>
    )
  }
  if ('tables' in result) {
    return (
      <div className="mt-3 flex flex-wrap gap-1">
        {(result as { tables: string[] }).tables.map(t => (
          <Badge key={t} variant="outline" className="font-mono text-[10px]">
            {t}
          </Badge>
        ))}
      </div>
    )
  }
  return null
}

function SqlResultTable({ result }: { result: SqlResult }) {
  const previewRows = result.rows.slice(0, 50)
  const moreRows = result.rows.length - previewRows.length
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-3 text-[11px] text-ink-3">
        <span>
          {result.row_count} row{result.row_count === 1 ? '' : 's'}
          {result.truncated ? ' (capped at 1000)' : ''}
        </span>
        <span>· {result.duration_ms} ms</span>
      </div>
      <div className="overflow-x-auto rounded border border-line">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-surface-2">
            <tr>
              {result.columns.map(c => (
                <th
                  key={c}
                  className="border-b border-line px-2 py-1.5 text-left font-medium text-ink"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.length === 0 ? (
              <tr>
                <td
                  colSpan={result.columns.length || 1}
                  className="px-2 py-3 text-center text-ink-3"
                >
                  No rows
                </td>
              </tr>
            ) : (
              previewRows.map((row, i) => (
                <tr key={i} className="even:bg-surface-1">
                  {row.map((v, j) => (
                    <td
                      key={j}
                      className="border-b border-line/60 px-2 py-1 align-top text-ink-2"
                    >
                      {formatCell(v)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {moreRows > 0 ? (
        <p className="text-[11px] text-ink-3">
          + {moreRows} more row{moreRows === 1 ? '' : 's'} not shown
        </p>
      ) : null}
    </div>
  )
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
