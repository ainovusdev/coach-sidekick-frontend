import { NextRequest, NextResponse } from 'next/server'
import { getRecallHeaders, config, isConfigured } from '@/lib/config'
import { transcriptStore } from '@/lib/transcript-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
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

    const allSessions = transcriptStore.getAllSessionIds()

    if (debug) {
      return NextResponse.json({
        debug: true,
        botId,
        allSessions: transcriptStore.getAllSessionsInfo(),
        targetSession: transcriptStore.getSessionInfo(botId),
        sessionExists: !!transcriptStore.getSession(botId),
        timestamp: new Date().toISOString(),
      })
    }

    const session = transcriptStore.getSession(botId)

    if (!session) {
      try {
        const botResponse = await fetch(
          `${config.recall.apiUrl}/bot/${botId}`,
          {
            headers: getRecallHeaders(),
          },
        )

        if (botResponse.ok) {
          const bot = await botResponse.json()

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

          const existingSession = transcriptStore.getSession(botId)
          if (existingSession) {
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

          transcriptStore.initSession(botId, normalizedBot)

          const newSession = transcriptStore.getSession(botId)

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
        }
        throw new Error(`Bot not found: ${botResponse.statusText}`)
      } catch (fetchError) {
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
        allSessions,
      },
    }

    return NextResponse.json(result)
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
