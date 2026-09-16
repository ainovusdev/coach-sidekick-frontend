import { Mail } from 'lucide-react'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { Empty } from '@/components/sandboxes/section'
import type { SandboxMember } from '@/types/sandbox'

/** Who to ask. Our side's contacts, with a way to reach them. */
export function AccountTeam({ team }: { team: SandboxMember[] }) {
  if (!team.length) return <Empty>Your account team will appear here.</Empty>
  return (
    <ul className="space-y-2.5">
      {team.map(m => (
        <li
          key={m.id}
          className="flex items-center gap-2.5"
          data-testid="team-contact"
        >
          <PersonAvatar name={m.name} email={m.email} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              {m.name || m.email}
            </p>
            <p className="truncate text-xs text-ink-3">
              {m.role_labels.join(', ')}
            </p>
          </div>
          <a
            href={`mailto:${m.email}`}
            className="shrink-0 rounded-md p-1.5 text-ink-4 hover:bg-surface-2 hover:text-ink"
            title={m.email}
            aria-label={`Email ${m.name || m.email}`}
          >
            <Mail className="h-4 w-4" />
          </a>
        </li>
      ))}
    </ul>
  )
}
