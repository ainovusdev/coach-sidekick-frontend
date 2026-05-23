'use client'

import { ChatMarkdown } from '@/components/ui/chat-markdown'
import { cn } from '@/lib/utils'
import { Sparkles, User } from 'lucide-react'
import { AgentChart } from './agent-chart'
import { AgentReportCard } from './agent-report-card'
import { AgentToolCallCard } from './agent-tool-call-card'
import type { AgentMessage as AgentMessageType } from '@/types/agent'

interface Props {
  message: AgentMessageType
}

export function AgentMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex w-full gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div
        className={cn(
          'mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm',
          isUser ? 'bg-ink text-paper' : 'bg-ds-accent text-ink-on-dark',
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
      </div>
      <div
        className={cn(
          'min-w-0 max-w-[85%] space-y-1',
          isUser && 'flex flex-col items-end',
        )}
      >
        {message.blocks.length === 0 ? (
          <div className="px-3 py-2 text-sm text-ink-3 italic">Thinking…</div>
        ) : (
          message.blocks.map((block, i) => {
            if (block.kind === 'text') {
              if (!block.text) return null
              return (
                <div
                  key={i}
                  className={cn(
                    'rounded-lg px-3 py-2',
                    isUser ? 'bg-ink text-paper' : 'bg-transparent text-ink',
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap text-sm">{block.text}</p>
                  ) : (
                    <ChatMarkdown content={block.text} />
                  )}
                </div>
              )
            }
            if (block.kind === 'tool_call') {
              return <AgentToolCallCard key={i} block={block} />
            }
            if (block.kind === 'chart') {
              return <AgentChart key={i} spec={block.spec} />
            }
            if (block.kind === 'report') {
              return <AgentReportCard key={i} spec={block.spec} />
            }
            return null
          })
        )}
        {!isUser && message.metrics ? (
          <MetricsFooter metrics={message.metrics} />
        ) : null}
      </div>
    </div>
  )
}

function MetricsFooter({
  metrics,
}: {
  metrics: NonNullable<AgentMessageType['metrics']>
}) {
  const parts: string[] = []
  if (typeof metrics.total_cost_usd === 'number') {
    parts.push(`$${metrics.total_cost_usd.toFixed(4)}`)
  }
  if (typeof metrics.duration_ms === 'number') {
    parts.push(`${(metrics.duration_ms / 1000).toFixed(1)}s`)
  }
  if (typeof metrics.num_turns === 'number') {
    parts.push(`${metrics.num_turns} turn${metrics.num_turns === 1 ? '' : 's'}`)
  }
  if (parts.length === 0) return null
  return (
    <div className="px-3 pt-1 text-[10px] text-ink-3">{parts.join(' · ')}</div>
  )
}
