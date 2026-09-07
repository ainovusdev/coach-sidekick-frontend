'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AtSign,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  MessageSquare,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useUpdateNotificationSettings,
} from '@/hooks/mutations/use-notification-mutations'
import {
  useNotificationSettings,
  useNotifications,
  useUnreadNotifications,
} from '@/hooks/queries/use-notifications'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/types/notifications'

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.max(0, Math.round(ms / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.round(d / 7)
  return `${w}w ago`
}

/** Leading icon by commitment event; sandbox/outcome rows keep the dot only. */
const EVENT_ICON: Record<string, LucideIcon> = {
  commitment_assigned: UserPlus,
  commitment_reassigned: UserPlus,
  commitment_commented: MessageSquare,
  commitment_mentioned: AtSign,
  commitment_completed: CheckCircle2,
  commitment_status_changed: CheckCircle2,
  commitment_rescheduled: Clock,
  commitment_due_today: Clock,
  commitment_overdue: Clock,
  // comments on goals, outcomes, sprints, sandbox outcomes and visions
  commented: MessageSquare,
  mentioned: AtSign,
}

function contextLine(n: AppNotification): string {
  return [n.data?.client_name, n.data?.sandbox_name]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join(' · ')
}

/**
 * The bell: unread count on the icon, the latest notifications in a popover,
 * and the person's own switch for the email half (sandbox and outcome events
 * are emailed unless they turn that off; commitment events are in-app only).
 * Clicking one marks it read and follows its link. Same component in every
 * header (coach, client portal, admin, the minimal sandbox header).
 */
export function NotificationBell({ className }: { className?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { data: unread } = useUnreadNotifications()
  const { data, isLoading } = useNotifications(open)
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const { data: settings } = useNotificationSettings(open)
  const updateSettings = useUpdateNotificationSettings()
  // the count query is always live; the list is only fetched while open
  const count = unread?.unread ?? data?.unread ?? 0
  const items = data?.items ?? []

  const openOne = (n: AppNotification) => {
    if (!n.is_read) markRead.mutate(n.id)
    setOpen(false)
    const url = typeof n.data?.url === 'string' ? n.data.url : null
    if (!url) return
    // Deep links (`?commitment=`, `?outcome=`, `#vision`…) are read when the
    // page mounts. A soft push to the page we are already on would keep it
    // mounted and read nothing, so that case reloads.
    const next = new URL(url, window.location.origin)
    if (next.pathname === window.location.pathname) window.location.assign(url)
    else router.push(url)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            count > 0 ? `Notifications, ${count} unread` : 'Notifications'
          }
          className={cn(
            'relative inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink',
            className,
          )}
          data-testid="notification-bell"
          data-unread={count}
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {count > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vermillion px-1 text-[10px] font-semibold leading-none text-white"
              data-testid="notification-badge"
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-0"
        data-testid="notification-popover"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-ink-3"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              data-testid="notifications-read-all"
            >
              <Check className="h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>
        <ul className="max-h-[420px] overflow-y-auto">
          {isLoading && items.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-ink-3">
              Loading…
            </li>
          ) : items.length === 0 ? (
            <li
              className="px-4 py-8 text-center"
              data-testid="notifications-empty"
            >
              <p className="text-sm font-medium text-ink">
                You’re all caught up
              </p>
              <p className="mt-1 text-xs text-ink-3">
                Nothing new since you last looked.
              </p>
            </li>
          ) : (
            items.map(n => {
              const event =
                typeof n.data?.event === 'string' ? n.data.event : undefined
              const Icon = event ? EVENT_ICON[event] : undefined
              const context = contextLine(n)
              return (
                <li key={n.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => openOne(n)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2',
                      !n.is_read && 'bg-surface-2/50',
                    )}
                    data-testid="notification-item"
                    data-read={n.is_read}
                    data-type={n.type}
                    data-event={event}
                  >
                    {Icon ? (
                      <span className="relative mt-0.5 shrink-0" aria-hidden>
                        <span
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full bg-surface-3',
                            n.is_read ? 'text-ink-3' : 'text-ink',
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </span>
                        {!n.is_read && (
                          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-vermillion ring-2 ring-paper" />
                        )}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          n.is_read ? 'bg-transparent' : 'bg-vermillion',
                        )}
                        aria-hidden
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span
                          className={cn(
                            'truncate text-sm',
                            n.is_read ? 'text-ink-2' : 'font-medium text-ink',
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="shrink-0 text-[11px] text-ink-4">
                          {timeAgo(n.created_at)}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-ink-3">
                        {n.message}
                      </span>
                      {context && (
                        <span className="mt-0.5 block truncate text-[11px] text-ink-4">
                          {context}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
        {settings && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
            <label
              htmlFor="notification-email-toggle"
              className="min-w-0 cursor-pointer"
            >
              <span className="block text-xs font-medium text-ink">
                Email me too
              </span>
              <span className="block truncate text-[11px] text-ink-4">
                {settings.email_enabled
                  ? `Sandbox and outcome updates also go to ${settings.email ?? 'your email'}.`
                  : 'Only shown here, no emails'}
              </span>
            </label>
            <Switch
              id="notification-email-toggle"
              checked={settings.email_enabled}
              onCheckedChange={checked => updateSettings.mutate(checked)}
              disabled={updateSettings.isPending}
              aria-label="Email me sandbox and outcome updates"
              data-testid="notification-email-toggle"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
