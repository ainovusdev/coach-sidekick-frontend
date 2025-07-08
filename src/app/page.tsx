'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MeetingForm } from '@/components/meeting-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Plus, Clock, Users } from 'lucide-react'

export default function CoachDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCreateBot = async (meetingUrl: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/recall/create-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meeting_url: meetingUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Failed to create bot: ${
            errorData.error || errorData.details || response.statusText
          }`,
        )
      }

      const bot = await response.json()

      if (!bot.id) {
        throw new Error('Bot was created but no ID was returned')
      }

      router.push(`/meeting/${bot.id}`)
    } catch (error) {
      alert(
        `Failed to create bot: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Coach Sidekick
              </h1>
              <p className="text-sm text-gray-600">
                Start your AI-assisted coaching session
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Centered and Simple */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Primary Action - Start Session */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-purple-700 text-xl">
                <Plus className="h-6 w-6" />
                Start New Coaching Session
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Enter your meeting URL to begin real-time coaching analysis
              </p>
            </CardHeader>
            <CardContent className="pb-8">
              <MeetingForm onSubmit={handleCreateBot} loading={loading} />
            </CardContent>
          </Card>

          {/* Recent Sessions - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-gray-600" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No recent sessions</p>
                <p className="text-xs text-gray-400 mt-1">
                  Your coaching sessions will appear here
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Bar */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>AI Analysis Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Real-time Transcription</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Coaching Insights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
