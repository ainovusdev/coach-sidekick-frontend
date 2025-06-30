'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MeetingForm } from '@/components/meeting-form'

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
        throw new Error('Failed to create bot')
      }

      const bot = await response.json()
      console.log('Bot created:', bot)

      // Navigate to the meeting page
      router.push(`/meeting/${bot.id}`)
    } catch (error) {
      console.error('Error creating bot:', error)
      alert('Failed to create bot. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Coach Sidekick
              </h1>
              <p className="text-gray-600 mt-1">
                AI-powered meeting assistant for coaches
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Ready to assist</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Meeting Setup */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Start Recording a Meeting
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Paste your meeting link below and our AI bot will join to
                provide real-time transcription and insights.
              </p>
            </div>

            <MeetingForm onSubmit={handleCreateBot} loading={loading} />

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">
                  Zoom & Google Meet
                </h3>
                <p className="text-sm text-gray-600">
                  Supports all major platforms
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">
                  Real-time Transcription
                </h3>
                <p className="text-sm text-gray-600">
                  Live transcript as it happens
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">AI Insights</h3>
                <p className="text-sm text-gray-600">
                  Smart analysis and summaries
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
