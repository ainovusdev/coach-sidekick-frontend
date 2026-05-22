import { MeetingFormSimple } from '@/components/meeting/meeting-form-simple'
import { AlertCircle } from 'lucide-react'

interface StartRecordingProps {
  loading: boolean
  error: string | null
  onSubmit: (meetingUrl: string, clientId?: string) => void
}

export default function StartRecording({
  loading,
  error,
  onSubmit,
}: StartRecordingProps) {
  return (
    <div>
      <MeetingFormSimple onSubmit={onSubmit} loading={loading} />
      {error && (
        <div className="mt-4 p-3 bg-vermillion-bg border border-vermillion rounded-lg">
          <p className="text-sm text-vermillion flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}
    </div>
  )
}
