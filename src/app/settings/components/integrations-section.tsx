'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { useCalendarConnection } from '@/hooks/queries/use-calendar'
import {
  useDisconnectCalendar,
  useUpdateCalendarSettings,
} from '@/hooks/mutations/use-calendar-mutations'
import { CalendarService } from '@/services/calendar-service'

export function IntegrationsSection() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: status, isLoading } = useCalendarConnection()
  const updateSettings = useUpdateCalendarSettings()
  const disconnect = useDisconnectCalendar()

  useEffect(() => {
    const connected = searchParams.get('calendar_connected')
    const error = searchParams.get('calendar_error')
    if (connected) {
      toast.success('Google Calendar connected')
      router.replace('/settings?tab=profile#integrations')
    } else if (error) {
      toast.error(`Calendar connection failed: ${error}`)
      router.replace('/settings?tab=profile#integrations')
    }
  }, [searchParams, router])

  const [titlePrefix, setTitlePrefix] = useState<string>('')
  useEffect(() => {
    if (status) setTitlePrefix(status.title_prefix_filter ?? '')
  }, [status])

  const startConnect = async () => {
    try {
      const { auth_url } = await CalendarService.getAuthUrl()
      window.location.href = auth_url
    } catch (e) {
      toast.error(
        (e as Error).message ||
          'Could not start Google authorization — is the OAuth app configured?',
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-6 w-6 mt-1" />
            <div>
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription className="mt-1">
                Auto-create coaching sessions from events on your calendar. The
                bot joins each meeting on its own; pre-session questionnaires
                are sent to clients automatically.
              </CardDescription>
            </div>
          </div>
          {status?.connected ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Not connected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
        ) : !status?.connected ? (
          <div>
            <Button onClick={startConnect}>Connect Google Calendar</Button>
            <p className="mt-3 text-sm text-muted-foreground">
              We&apos;ll redirect you to Google to authorize access. Your
              refresh token is stored at Recall.ai — we never persist it on our
              servers.
            </p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Connected as{' '}
              <span className="font-medium text-foreground">
                {status.google_account_email ?? 'unknown account'}
              </span>
              {status.last_sync_at && (
                <>
                  {' '}
                  · last synced {new Date(status.last_sync_at).toLocaleString()}
                </>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="auto-questionnaire" className="text-base">
                    Auto-send pre-session questionnaire
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Email the questionnaire to the matched client when an event
                    is added to your calendar.
                  </p>
                </div>
                <Switch
                  id="auto-questionnaire"
                  checked={status.auto_send_questionnaire}
                  onCheckedChange={value =>
                    updateSettings.mutate({
                      auto_send_questionnaire: value,
                    })
                  }
                />
              </div>

              {/* Auto-deploy bot toggle is hidden for now — feature is not
                  ready for coach-facing release. Re-enable when we ship it. */}

              <div className="space-y-2">
                <Label htmlFor="title-prefix">
                  Title-prefix override (optional)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Events whose title begins with this prefix become solo
                  sessions even without a recognized client attendee — handy for
                  prep calls. Leave blank to disable.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="title-prefix"
                    value={titlePrefix}
                    onChange={e => setTitlePrefix(e.target.value)}
                    placeholder="e.g. [Coaching]"
                    maxLength={64}
                    className="max-w-xs"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      updateSettings.mutate({
                        title_prefix_filter: titlePrefix.trim() || null,
                      })
                    }
                    disabled={
                      updateSettings.isPending ||
                      titlePrefix.trim() === (status.title_prefix_filter ?? '')
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Button
                variant="destructive"
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
              >
                Disconnect
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
