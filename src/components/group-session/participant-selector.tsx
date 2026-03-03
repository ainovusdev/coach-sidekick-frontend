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
                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700',
            )}
          >
            <span
              className={cn(
                'w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-semibold leading-none',
                isSelected
                  ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
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
