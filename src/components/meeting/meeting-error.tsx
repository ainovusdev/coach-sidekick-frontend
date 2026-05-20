import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface MeetingErrorProps {
  error: string
}

export function MeetingError({ error }: MeetingErrorProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="max-w-md mx-auto bg-surface-1 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-vermillion text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-ink mb-2">
            Configuration Error
          </h2>
          <p className="text-ink-3 mb-4">{error}</p>
          <Button onClick={() => router.push('/')} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
