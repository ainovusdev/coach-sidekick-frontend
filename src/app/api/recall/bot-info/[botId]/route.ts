import { NextRequest, NextResponse } from 'next/server'
import { getRecallHeaders, config, isConfigured } from '@/lib/config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    // Check if the app is properly configured
    if (!isConfigured()) {
      return NextResponse.json(
        {
          error: 'Application not configured',
          message:
            'RECALL_API_KEY is missing. Please check your environment variables.',
        },
        { status: 500 },
      )
    }

    const { botId } = await params
    const response = await fetch(`${config.recall.apiUrl}/bot/${botId}`, {
      headers: getRecallHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch bot info: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching bot info:', error)

    if (error instanceof Error && error.message.includes('RECALL_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Configuration error',
          message: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch bot info' },
      { status: 500 },
    )
  }
}
