import { NextRequest, NextResponse } from 'next/server'
import { getRecallHeaders, config, isConfigured } from '@/lib/config'

export async function POST(
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

    // Stop the bot
    const response = await fetch(
      `${config.recall.apiUrl}/bot/${botId}/leave_call`,
      {
        method: 'POST',
        headers: getRecallHeaders(),
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to stop bot: ${response.statusText}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Bot stopped successfully',
      bot: data,
    })
  } catch (error) {
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
      {
        error: 'Failed to stop bot',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
