import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientChatUnified } from './client-chat-unified'
import { Lock, Eye } from 'lucide-react'

interface ChatTabProps {
  clientId: string
  clientName: string
  isViewer: boolean
}

export function ChatTab({ clientId, clientName, isViewer }: ChatTabProps) {
  if (isViewer) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="border-line shadow-sm max-w-md w-full">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-ds-accent-bg rounded-full mb-4">
                <Lock className="h-8 w-8 text-ds-accent" />
              </div>
              <h3 className="text-lg font-semibold text-ink mb-2">
                Restricted Access
              </h3>
              <p className="text-sm text-ink-3 mb-4">
                Chat functionality is not available with viewer permissions.
              </p>
              <Badge
                variant="outline"
                className="bg-ds-accent-bg border-ds-accent text-ds-accent"
              >
                <Eye className="h-3 w-3 mr-1.5" />
                View Only Mode
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ph-no-capture: the AI chat surfaces client data and coaching insights, so
  // its content is excluded from session replay even on this recorded route.
  return (
    <div className="ph-no-capture h-full">
      <ClientChatUnified clientId={clientId} clientName={clientName} />
    </div>
  )
}
