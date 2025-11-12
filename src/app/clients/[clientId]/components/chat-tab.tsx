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
        <Card className="border-gray-200 shadow-sm max-w-md w-full">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-blue-50 rounded-full mb-4">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Restricted Access
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Chat functionality is not available with viewer permissions.
              </p>
              <Badge
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700"
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

  return (
    <Card className="border-gray-200 shadow-sm h-full">
      <CardContent className="p-0 h-full">
        <ClientChatUnified clientId={clientId} clientName={clientName} />
      </CardContent>
    </Card>
  )
}
