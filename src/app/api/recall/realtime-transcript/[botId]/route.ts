import { NextRequest, NextResponse } from 'next/server'
import { transcriptStore } from '@/lib/transcript-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    const { botId } = await params

    console.log(`[Realtime Transcript] Getting transcript for bot: ${botId}`)

    // Get session from in-memory store
    const session = transcriptStore.getSession(botId)

    if (!session) {
      return NextResponse.json(
        {
          error: 'Bot session not found',
          bot: null,
          transcript: [],
        },
        { status: 404 },
      )
    }

    // Return real-time data
    const result = {
      bot: {
        id: session.bot.id,
        status: session.bot.status,
        meeting_url: session.bot.meeting_url,
        platform: session.bot.platform,
        meeting_id: session.bot.meeting_id,
      },
      transcript: session.transcript,
      lastUpdated: session.lastUpdated,
      debug: {
        transcriptCount: session.transcript.length,
        sessionExists: true,
        isLive: true,
      },
    }

    console.log(
      `[Realtime Transcript] Returning ${session.transcript.length} entries for bot ${botId}`,
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Realtime Transcript] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch real-time transcript',
        details: error.message,
      },
      { status: 500 },
    )
  }
}
