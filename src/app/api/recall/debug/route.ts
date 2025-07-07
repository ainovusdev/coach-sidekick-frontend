import { NextRequest, NextResponse } from 'next/server'
import { transcriptStore } from '@/lib/transcript-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')

    console.log(`[Debug] Debug endpoint called with botId: ${botId}`)

    if (botId) {
      // Get specific bot session info
      const session = transcriptStore.getSession(botId)
      const sessionInfo = transcriptStore.getSessionInfo(botId)

      return NextResponse.json({
        type: 'single_session',
        botId,
        sessionExists: !!session,
        sessionInfo,
        transcript: session?.transcript || [],
        allSessions: transcriptStore.getAllSessionIds(),
        timestamp: new Date().toISOString(),
      })
    } else {
      // Get all sessions info
      const allSessionsInfo = transcriptStore.getAllSessionsInfo()
      const allSessionIds = transcriptStore.getAllSessionIds()

      return NextResponse.json({
        type: 'all_sessions',
        totalSessions: allSessionIds.length,
        sessionIds: allSessionIds,
        sessions: allSessionsInfo,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('[Debug] Error in debug endpoint:', error)
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
