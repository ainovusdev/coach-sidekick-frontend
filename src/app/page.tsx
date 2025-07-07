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
      console.log('Creating bot with URL:', meetingUrl)

      const response = await fetch('/api/recall/create-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meeting_url: meetingUrl }),
      })

      console.log('Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error response:', errorData)
        throw new Error(
          `Failed to create bot: ${
            errorData.error || errorData.details || response.statusText
          }`,
        )
      }

      const bot = await response.json()
      console.log('Bot created successfully:', bot)
      console.log('Bot ID:', bot.id)
      console.log('Bot keys:', Object.keys(bot))

      if (!bot.id) {
        console.error('Bot response missing ID field:', bot)
        throw new Error('Bot was created but no ID was returned')
      }

      // Navigate to the meeting page
      console.log(`Navigating to: /meeting/${bot.id}`)
      router.push(`/meeting/${bot.id}`)
    } catch (error) {
      console.error('Error creating bot:', error)
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Coach Sidekick</h1>
                <p className="text-sm text-muted-foreground">
                  Meeting Assistant
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Ready
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <MeetingForm onSubmit={handleCreateBot} loading={loading} />
        </div>
      </main>
    </div>
  )
}
