import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MeetingFormSimple } from '@/components/meeting/meeting-form-simple'
import { AlertCircle } from 'lucide-react'

interface StartRecordingProps {
  loading: boolean
  error: string | null
  onSubmit: (meetingUrl: string, clientId?: string) => void
}

export default function StartRecording({ loading, error, onSubmit }: StartRecordingProps) {
  return (
    <Card className="border-neutral-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-neutral-900">
          Start Recording
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MeetingFormSimple onSubmit={onSubmit} loading={loading} />
        {error && (
          <div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
            <p className="text-sm text-neutral-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}