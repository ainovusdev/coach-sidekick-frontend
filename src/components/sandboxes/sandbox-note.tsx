'use client'

import { Boxes } from 'lucide-react'
import { usePortalSandboxes } from '@/hooks/queries/use-sandboxes'

/** One quiet line on the client-portal dashboard when the person is a coachee in a sandbox. */
export function SandboxNote() {
  const { data } = usePortalSandboxes()
  if (!data || data.length === 0) return null
  return (
    <div className="mb-5 space-y-1" data-testid="sandbox-note">
      {data.map(s => (
        <p
          key={s.id}
          className="flex items-center gap-2 text-[13px] text-ink-3"
        >
          <Boxes className="h-3.5 w-3.5 text-ink-4" />
          <span>
            You’re part of{' '}
            <span className="font-medium text-ink-2">{s.name}</span> with{' '}
            {s.organisation}
            {s.coach_names.length > 0 && (
              <> · coached by {s.coach_names.join(' and ')}</>
            )}
          </span>
        </p>
      ))}
    </div>
  )
}
