import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/sandbox/format'

interface PersonAvatarProps {
  name?: string | null
  email?: string | null
  /** Dashed outline = this person has not been invited yet. */
  dashed?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  title?: string
}

const SIZE = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

export function PersonAvatar({
  name,
  email,
  dashed = false,
  size = 'sm',
  className,
  title,
}: PersonAvatarProps) {
  const initials = getInitials(name, email ?? '')
  return (
    <span
      title={title ?? name ?? email ?? undefined}
      aria-label={name ?? email ?? undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium select-none',
        SIZE[size],
        dashed
          ? 'border border-dashed border-ink-4 bg-transparent text-ink-3'
          : 'bg-surface-3 text-ink-2',
        className,
      )}
    >
      {initials}
    </span>
  )
}

/** Overlapping avatar row, e.g. coaches | coachees on a group card. */
export function AvatarStack({
  people,
  dashedIds,
  max = 5,
  size = 'sm',
  className,
}: {
  people: { id: string; name: string | null; email: string | null }[]
  dashedIds?: Set<string>
  max?: number
  size?: 'xs' | 'sm' | 'md'
  className?: string
}) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <span className={cn('inline-flex items-center', className)}>
      {shown.map((p, i) => (
        <PersonAvatar
          key={p.id}
          name={p.name}
          email={p.email}
          size={size}
          dashed={dashedIds?.has(p.id)}
          className={cn('ring-2 ring-paper', i > 0 && '-ml-2')}
        />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-surface-2 text-ink-3 ring-2 ring-paper -ml-2',
            SIZE[size],
          )}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}
