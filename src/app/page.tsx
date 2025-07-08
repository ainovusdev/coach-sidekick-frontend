'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MeetingForm } from '@/components/meeting-form'
import { Badge } from '@/components/ui/badge'
import { Bot } from 'lucide-react'

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
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Bot className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">
                Coach Sidekick
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              AI-powered meeting transcription and coaching insights
            </p>
            <div className="flex justify-center mt-4">
              <Badge variant="secondary" className="text-sm">
                Powered by Recall.ai
              </Badge>
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <MeetingForm onSubmit={handleCreateBot} loading={loading} />
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-blue-600 font-semibold mb-2">
                  1. Join Meeting
                </div>
                <p className="text-gray-700 text-sm">
                  Enter your meeting URL and our AI bot will join automatically
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-green-600 font-semibold mb-2">
                  2. Live Transcription
                </div>
                <p className="text-gray-700 text-sm">
                  Watch real-time transcription as your meeting progresses
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-purple-600 font-semibold mb-2">
                  3. Get Insights
                </div>
                <p className="text-gray-700 text-sm">
                  Receive AI-powered coaching insights and action items
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
