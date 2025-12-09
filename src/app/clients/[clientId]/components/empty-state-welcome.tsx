'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, Upload, Target } from 'lucide-react'

interface EmptyStateWelcomeProps {
  client: any
  onStartSession: () => void
  onAddPastSession: () => void
  onSetGoals: () => void
}

export function EmptyStateWelcome({
  client,
  onStartSession,
  onAddPastSession,
  onSetGoals,
}: EmptyStateWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-3xl w-full space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-black">
            Welcome to {client.name}&apos;s coaching journey
          </h2>
          <p className="text-gray-500 text-lg">
            Get started by choosing an action below
          </p>
        </div>

        {/* Action Buttons - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Start Live Session */}
          <Card className="p-6 hover:shadow-md transition-all border-gray-200 hover:border-black">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-black flex items-center justify-center">
                <Mic className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Start Live Session
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Real-time transcription and AI insights
                </p>
              </div>
              <Button
                onClick={onStartSession}
                className="w-full bg-black hover:bg-gray-800"
              >
                Start Session
              </Button>
            </div>
          </Card>

          {/* Add Past Session */}
          <Card className="p-6 hover:shadow-md transition-all border-gray-200 hover:border-black">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="h-7 w-7 text-gray-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Upload Past Session
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add notes or recordings from previous sessions
                </p>
              </div>
              <Button
                onClick={onAddPastSession}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50 hover:border-black"
              >
                Upload Session
              </Button>
            </div>
          </Card>

          {/* Set Vision */}
          <Card className="p-6 hover:shadow-md transition-all border-gray-200 hover:border-black">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <Target className="h-7 w-7 text-gray-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Set Vision
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Define outcomes to track progress over time
                </p>
              </div>
              <Button
                onClick={onSetGoals}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50 hover:border-black"
              >
                Create Vision
              </Button>
            </div>
          </Card>
        </div>

        {/* Helpful Tip */}
        <div className="mt-8 p-5 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            <strong className="text-black">Tip:</strong> Start with a live
            session to experience AI-assisted coaching, or set a vision first to
            establish a clear direction.
          </p>
        </div>
      </div>
    </div>
  )
}
