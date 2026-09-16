import { PersonAvatar } from '@/components/ui/person-avatar'
import { pluralise } from '@/lib/sandbox/format'
import { Empty } from './section'
import type { SandboxAnalytics } from '@/types/sandbox-analytics'

/**
 * Who is doing the coaching, and how much of it. Activity, never a ranking:
 * a coach with fewer sessions may simply have fewer coachees.
 */
export function CoachesStrip({
  coaches,
}: {
  coaches: SandboxAnalytics['coaches']
}) {
  if (!coaches.length) return <Empty>No coaches on this yet.</Empty>
  return (
    <ul className="space-y-2.5">
      {coaches.map(c => (
        <li
          key={c.user_id}
          className="flex items-center gap-2.5"
          data-testid="coach-row"
        >
          <PersonAvatar name={c.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{c.name}</p>
            <p className="truncate text-xs text-ink-3">
              {pluralise(c.sessions_held, 'session')} held ·{' '}
              {pluralise(c.coachees_reached, 'coachee')} reached
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
