'use client'

import { GroupSessionParticipant } from '@/types/group-session'
import { cn } from '@/lib/utils'

interface ParticipantSelectorProps {
  participants: GroupSessionParticipant[]
  selectedId: string | null
  onSelect: (clientId: string | null) => void
  label?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ParticipantSelector({
  participants,
  selectedId,
  onSelect,
}: ParticipantSelectorProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {participants.map(p => {
        const isSelected = selectedId === p.client_id
        return (
          <button
            key={p.client_id}
            onClick={() => onSelect(p.client_id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
              isSelected
                ? 'bg-ink text-ink-on-dark border-line shadow-sm'
                : 'bg-surface-1 text-ink-3 border-line hover:border-line-strong hover:bg-paper ',
            )}
          >
            <span
              className={cn(
                'w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-semibold leading-none',
                isSelected
                  ? 'bg-surface-1/20 text-ink-on-dark '
                  : 'bg-surface-3 text-ink-3 ',
              )}
            >
              {getInitials(p.client_name)}
            </span>
            {p.client_name.split(' ')[0]}
          </button>
        )
      })}
    </div>
  )
}
