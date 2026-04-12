'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Play,
  Link2,
  CalendarClock,
  Upload,
  Loader2,
  Bot,
  Send,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStartSessionBot } from '@/hooks/mutations/use-questionnaire-mutations'
import { useSendQuestionnaire } from '@/hooks/mutations/use-questionnaire-mutations'
import { useQuestionnaireResponses } from '@/hooks/queries/use-questionnaire'
import { toast } from '@/hooks/use-toast'

interface StartBotCardProps {
  sessionId: string
  clientId?: string
  clientName?: string
  scheduledFor?: string | null
  meetingUrl?: string | null
  questionnaireSent?: boolean
  onShowUploader: () => void
}

export function StartBotCard({
  sessionId,
  clientId,
  clientName,
  scheduledFor,
  meetingUrl: initialMeetingUrl,
  questionnaireSent,
  onShowUploader,
}: StartBotCardProps) {
  const router = useRouter()
  const startBot = useStartSessionBot()
  const sendQuestionnaire = useSendQuestionnaire()
  const { data: responses } = useQuestionnaireResponses(sessionId)
  const [meetingUrl, setMeetingUrl] = useState(initialMeetingUrl || '')
  const [botName, setBotName] = useState('Coach Sidekick')

  const hasResponses =
    responses && responses.length > 0 && responses[0].responses.length > 0
  const showSendButton = !hasResponses && clientId

  const handleStartBot = async () => {
    if (!meetingUrl.trim()) {
      toast({
        title: 'Meeting URL required',
        description: 'Please enter a meeting URL to start the bot.',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await startBot.mutateAsync({
        sessionId,
        meetingUrl: meetingUrl.trim(),
        botName: botName || undefined,
      })

      toast({
        title: 'Bot started',
        description: 'Redirecting to the live meeting page...',
      })

      setTimeout(() => {
        router.push(`/meeting/${result.id}`)
      }, 500)
    } catch {
      // Error handled by mutation hook
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Session Info */}
      <Card className="border-app-border shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bot className="h-8 w-8 text-gray-500" />
          </div>

          <h2 className="text-xl font-semibold text-app-primary mb-2">
            Ready to Start
          </h2>

          {clientName && (
            <p className="text-app-secondary mb-1">
              Session with{' '}
              <span className="font-medium text-app-primary">{clientName}</span>
            </p>
          )}

          {scheduledFor && (
            <div className="flex items-center justify-center gap-1.5 text-sm text-app-secondary mb-6">
              <CalendarClock className="h-4 w-4" />
              {format(new Date(scheduledFor), "EEEE, MMMM d 'at' h:mm a")}
            </div>
          )}

          {/* Send Questionnaire */}
          {showSendButton && (
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() =>
                  sendQuestionnaire.mutate({
                    sessionId,
                    clientId: clientId!,
                  })
                }
                disabled={sendQuestionnaire.isPending}
                className="border-gray-300 dark:border-gray-600"
              >
                {sendQuestionnaire.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {questionnaireSent
                      ? 'Resend Questionnaire'
                      : 'Send Pre-Session Questionnaire'}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Meeting URL */}
          <div className="text-left space-y-4 mt-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Meeting URL <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={meetingUrl}
                  onChange={e => setMeetingUrl(e.target.value)}
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Bot Name{' '}
                <span className="text-muted-foreground font-normal">
                  (Optional)
                </span>
              </Label>
              <Input
                value={botName}
                onChange={e => setBotName(e.target.value)}
                placeholder="Coach Sidekick"
              />
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStartBot}
            disabled={!meetingUrl.trim() || startBot.isPending}
            size="lg"
            className="w-full mt-6 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 h-12 text-base"
          >
            {startBot.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Starting Bot...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start Bot & Join Meeting
              </>
            )}
          </Button>

          {/* Upload alternative */}
          <div className="mt-4 pt-4 border-t border-app-border">
            <button
              onClick={onShowUploader}
              className="text-sm text-app-secondary hover:text-app-primary transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <Upload className="h-3.5 w-3.5" />
              Or upload a past recording instead
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
