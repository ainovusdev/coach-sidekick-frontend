import { NextRequest, NextResponse } from 'next/server'
import { getRecallHeaders, config, isConfigured } from '@/lib/config'
import { transcriptStore } from '@/lib/transcript-store'

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
    const { searchParams } = new URL(request.url)
    const debug = searchParams.get('debug') === 'true'

    console.log(`[Realtime Transcript] Getting transcript for bot: ${botId}`)

    // Debug: Show all existing sessions
    const allSessions = transcriptStore.getAllSessionIds()
    console.log(`[Realtime Transcript] All sessions:`, allSessions)

    // If debug mode, return detailed session information
    if (debug) {
      console.log(`[Realtime Transcript] Debug mode enabled for bot: ${botId}`)

      return NextResponse.json({
        debug: true,
        botId,
        allSessions: transcriptStore.getAllSessionsInfo(),
        targetSession: transcriptStore.getSessionInfo(botId),
        sessionExists: !!transcriptStore.getSession(botId),
        timestamp: new Date().toISOString(),
      })
    }

    // Get session from in-memory store
    const session = transcriptStore.getSession(botId)

    console.log(`[Realtime Transcript] Session found:`, !!session)
    if (session) {
      console.log(
        `[Realtime Transcript] Session transcript length:`,
        session.transcript.length,
      )
      console.log(
        `[Realtime Transcript] Session created at:`,
        session.createdAt,
      )
      console.log(
        `[Realtime Transcript] Session webhook events:`,
        session.webhookEvents,
      )
    }

    if (!session) {
      // If no session exists, try to get bot info from API and create empty session
      try {
        console.log(
          `[Realtime Transcript] No session found, fetching bot info from API for ${botId}`,
        )

        const botResponse = await fetch(
          `${config.recall.apiUrl}/bot/${botId}`,
          {
            headers: getRecallHeaders(),
          },
        )

        if (botResponse.ok) {
          const bot = await botResponse.json()

          // Create a session with empty transcript
          const normalizedBot = {
            id: bot.id,
            status:
              bot.status_changes?.[bot.status_changes.length - 1]?.code ||
              'unknown',
            meeting_url:
              typeof bot.meeting_url === 'string'
                ? bot.meeting_url
                : bot.meeting_url?.meeting_id
                ? `https://meet.google.com/${bot.meeting_url.meeting_id}`
                : '#',
            platform: bot.meeting_url?.platform,
            meeting_id: bot.meeting_url?.meeting_id,
          }

          console.log(
            `[Realtime Transcript] Initializing session for bot ${botId}`,
          )

          // Check if session was created by webhook while we were fetching bot data
          const existingSession = transcriptStore.getSession(botId)
          if (existingSession) {
            console.log(
              `[Realtime Transcript] Session already exists with ${existingSession.transcript.length} entries, using it`,
            )

            return NextResponse.json({
              bot: {
                id: existingSession.bot.id,
                status: existingSession.bot.status,
                meeting_url: existingSession.bot.meeting_url,
                platform: existingSession.bot.platform,
                meeting_id: existingSession.bot.meeting_id,
              },
              transcript: existingSession.transcript,
              lastUpdated: existingSession.lastUpdated,
              debug: {
                transcriptCount: existingSession.transcript.length,
                sessionExists: true,
                isLive: true,
                source: 'found_after_bot_fetch',
                webhookEvents: existingSession.webhookEvents,
                createdAt: existingSession.createdAt,
              },
            })
          }

          // Only initialize if still no session exists
          transcriptStore.initSession(botId, normalizedBot)

          // Get the newly created session
          const newSession = transcriptStore.getSession(botId)
          console.log(
            `[Realtime Transcript] Created new session with ${
              newSession?.transcript.length || 0
            } entries`,
          )

          return NextResponse.json({
            bot: normalizedBot,
            transcript: newSession?.transcript || [],
            lastUpdated: new Date().toISOString(),
            debug: {
              transcriptCount: newSession?.transcript.length || 0,
              sessionExists: true,
              isLive: true,
              justCreated: true,
              webhookEvents: newSession?.webhookEvents || 0,
              createdAt: newSession?.createdAt || new Date().toISOString(),
            },
          })
        } else {
          throw new Error(`Bot not found: ${botResponse.statusText}`)
        }
      } catch (fetchError) {
        console.error(
          `[Realtime Transcript] Error fetching bot info:`,
          fetchError,
        )
        return NextResponse.json(
          {
            error: 'Bot session not found',
            bot: null,
            transcript: [],
            debug: {
              allSessions,
              fetchError:
                fetchError instanceof Error
                  ? fetchError.message
                  : 'Unknown error',
            },
          },
          { status: 404 },
        )
      }
    }

    // Return real-time data from the store
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
        source: 'existing_session',
        webhookEvents: session.webhookEvents,
        createdAt: session.createdAt,
        allSessions, // Include all session IDs for debugging
      },
    }

    console.log(
      `[Realtime Transcript] Returning ${session.transcript.length} entries for bot ${botId} from existing session`,
    )

    console.log(
      '[Realtime Transcript] Full response:',
      JSON.stringify(
        {
          ...result,
          transcript: result.transcript.map(t => ({
            speaker: t.speaker,
            text: t.text.substring(0, 50) + (t.text.length > 50 ? '...' : ''),
            is_final: t.is_final,
            timestamp: t.timestamp,
          })),
        },
        null,
        2,
      ),
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching real-time transcript:', error)

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
        error: 'Failed to fetch real-time transcript',
        debug: {
          allSessions: transcriptStore.getAllSessionIds(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 },
    )
  }
}
