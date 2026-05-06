import { ReactNode } from 'react'
import { ChevronRight, Clock, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * SessionRow — list-first session primitive.
 *
 * The audit's Before/After bet: same compact row template on dashboard,
 * /sessions, and client detail. ~76px tall vs. ~220px for the legacy
 * SessionCard. Status uses paired color + dot so it survives grayscale and
 * is accessible to color-blind users.
 *
 * Presentational only — consumers normalize their data shape into these props.
 */

type SessionStatus =
  | 'live'
  | 'completed'
  | 'error'
  | 'processing'
  | 'scheduled'
  | 'idle'

const STATUS_STYLES: Record<
  SessionStatus,
  { dot: string; pillClass: string; defaultLabel: string; ping?: boolean }
> = {
  live: {
    dot: 'bg-forest',
    pillClass: 'bg-forest-bg text-forest border-forest/20',
    defaultLabel: 'Live',
    ping: true,
  },
  completed: {
    dot: 'bg-ink-3',
    pillClass: 'bg-surface-2 text-ink-2 border-line',
    defaultLabel: 'Completed',
  },
  error: {
    dot: 'bg-vermillion',
    pillClass: 'bg-vermillion-bg text-vermillion border-vermillion/20',
    defaultLabel: 'Error',
  },
  processing: {
    dot: 'bg-amber-token',
    pillClass: 'bg-amber-token-bg text-amber-token border-amber-token/20',
    defaultLabel: 'Processing',
  },
  scheduled: {
    dot: 'bg-indigo',
    pillClass: 'bg-indigo-bg text-indigo border-indigo/20',
    defaultLabel: 'Scheduled',
  },
  idle: {
    dot: 'bg-ink-4',
    pillClass: 'bg-surface-2 text-ink-3 border-line',
    defaultLabel: 'Idle',
  },
}

interface SessionRowProps {
  /** Primary line, e.g. "Maria K. · Q2 strategy review". */
  title: string
  /** Mono meta beside the title — usually source: "Zoom" / "Google Meet" / "Teams". */
  source?: string
  /** Single-line summary. Will be truncated. Hidden when `restricted` is true. */
  summary?: string
  /** Formatted date, e.g. "Apr 22". Rendered in mono. */
  date?: string
  /** Relative time, e.g. "8 days ago". Plain text. */
  relativeTime?: string
  /** Duration, e.g. "52m". Rendered with a clock icon. */
  duration?: string
  /** Avatar — either initials or an image. */
  avatar?: { initials?: string; src?: string }
  /** Status drives both the dot color on the avatar and the right-side pill. */
  status?: SessionStatus
  /** Override the pill label. Defaults to status's title-case label. */
  statusLabel?: string
  /** Inline badges (e.g. group session). Rendered next to the title. */
  badges?: ReactNode
  /** Replace the summary line with a "Content restricted" notice (viewer state). */
  restricted?: boolean
  restrictedLabel?: string
  /**
   * Replace the summary with a live-status line (e.g. "Recording in progress")
   * when the session is live and has no summary yet. Rendered in forest.
   */
  liveLabel?: string
  /**
   * Replace the summary with a placeholder when completed but processing.
   * Rendered in ink-3 italic.
   */
  pendingLabel?: string
  /** Right-aligned actions. Rendered before the chevron. */
  actions?: ReactNode
  onClick?: () => void
  className?: string
}

export function SessionRow({
  title,
  source,
  summary,
  date,
  relativeTime,
  duration,
  avatar,
  status = 'idle',
  statusLabel,
  badges,
  restricted,
  restrictedLabel = 'Content restricted',
  liveLabel,
  pendingLabel,
  actions,
  onClick,
  className,
}: SessionRowProps) {
  const styles = STATUS_STYLES[status]
  const isLive = status === 'live'
  const interactive = typeof onClick === 'function'

  const showSummary = !restricted && !!summary
  const showLive = !restricted && !summary && isLive && liveLabel
  const showPending = !restricted && !summary && !isLive && pendingLabel

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={cn(
        'group flex items-start gap-4 px-5 py-4 border-b border-line-2 last:border-b-0 transition-colors',
        interactive && 'cursor-pointer hover:bg-surface-2/50',
        className,
      )}
    >
      {/* Avatar with status dot */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden">
          {avatar?.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar.src}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-mono text-[11px] font-semibold text-ink-2">
              {avatar?.initials || '··'}
            </span>
          )}
        </div>
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-paper',
            styles.dot,
          )}
        />
        {styles.ping && (
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full animate-ping opacity-60',
              styles.dot,
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h4 className="font-sans text-[13px] font-semibold text-ink truncate">
            {title}
          </h4>
          {source && (
            <span className="font-mono text-[11px] text-ink-3">{source}</span>
          )}
          {badges}
        </div>

        {(date || relativeTime || duration) && (
          <div className="flex items-center gap-2 text-[11px] text-ink-3 mt-1">
            {date && <span className="font-mono tnum">{date}</span>}
            {date && (relativeTime || duration) && (
              <span className="text-ink-4">·</span>
            )}
            {relativeTime && <span>{relativeTime}</span>}
            {(date || relativeTime) && duration && (
              <span className="text-ink-4">·</span>
            )}
            {duration && (
              <span className="inline-flex items-center gap-1 tnum">
                <Clock className="h-3 w-3" strokeWidth={1.75} />
                {duration}
              </span>
            )}
          </div>
        )}

        {showSummary && (
          <p className="text-[12px] text-ink-2 mt-1 truncate">{summary}</p>
        )}
        {restricted && (
          <p className="text-[12px] text-ink-3 mt-1 inline-flex items-center gap-1">
            <Lock className="h-3 w-3" strokeWidth={1.75} />
            {restrictedLabel}
          </p>
        )}
        {showLive && (
          <p className="text-[12px] text-forest mt-1 font-medium">
            {liveLabel}
          </p>
        )}
        {showPending && (
          <p className="text-[12px] text-ink-3 italic mt-1">{pendingLabel}</p>
        )}
      </div>

      {/* Right side: status pill + actions + chevron */}
      <div className="flex items-center gap-2 shrink-0 self-center">
        {status !== 'idle' && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 h-6 px-2 rounded-sm border text-[11px] font-medium font-sans',
              styles.pillClass,
            )}
          >
            <span
              className={cn('w-1.5 h-1.5 rounded-full', styles.dot)}
              aria-hidden
            />
            {statusLabel ?? styles.defaultLabel}
          </span>
        )}
        {actions}
        {interactive && (
          <ChevronRight
            className="h-4 w-4 text-ink-4 opacity-0 group-hover:opacity-100 transition-opacity"
            strokeWidth={1.75}
          />
        )}
      </div>
    </div>
  )
}

export function SessionRowSkeleton() {
  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-line-2 last:border-b-0">
      <div className="w-10 h-10 rounded-full bg-surface-2 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-surface-2 rounded-sm w-1/3 animate-pulse" />
        <div className="h-3 bg-surface-2 rounded-sm w-1/2 animate-pulse" />
      </div>
    </div>
  )
}

export type { SessionRowProps, SessionStatus }
