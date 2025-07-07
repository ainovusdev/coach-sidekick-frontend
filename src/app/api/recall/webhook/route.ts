import { NextRequest, NextResponse } from 'next/server'
import { transcriptStore } from '@/lib/transcript-store'

// This webhook will receive real-time transcript events from Recall.ai
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Webhook] Received:', JSON.stringify(body, null, 2))

    // Ensure we have a bot ID for all events
    const botId = body.data?.bot?.id
    if (!botId) {
      console.error('[Webhook] No bot ID found in webhook data')
      return NextResponse.json({ error: 'No bot ID provided' }, { status: 400 })
    }

    console.log(`[Webhook] Processing event '${body.event}' for bot ${botId}`)

    // Handle different webhook events
    switch (body.event) {
      case 'bot.status_change':
        console.log(
          `[Webhook] Bot ${botId} status changed to: ${body.data.status_change.code}`,
        )

        // Always ensure session exists with proper bot data
        const existingSession = transcriptStore.getSession(botId)
        if (!existingSession) {
          console.log(`[Webhook] Creating new session for bot ${botId}`)
          transcriptStore.initSession(botId, {
            id: botId,
            status: body.data.status_change.code,
            meeting_url: body.data.bot.meeting_url || '#',
            platform: body.data.bot.meeting_url?.platform,
            meeting_id: body.data.bot.meeting_url?.meeting_id,
          })
        } else {
          console.log(
            `[Webhook] Updating existing session status for bot ${botId}`,
          )
          // Update bot status
          transcriptStore.updateBotStatus(botId, body.data.status_change.code)
        }

        // Log session state after status change
        const sessionAfterStatus = transcriptStore.getSession(botId)
        console.log(`[Webhook] Session after status change:`, {
          exists: !!sessionAfterStatus,
          transcriptCount: sessionAfterStatus?.transcript.length || 0,
          webhookEvents: sessionAfterStatus?.webhookEvents || 0,
          status: sessionAfterStatus?.bot.status,
        })
        break

      case 'transcript.data':
        console.log(`[Webhook] Final transcript for bot ${botId}:`, {
          wordsCount: body.data.data?.words?.length || 0,
          participantName: body.data.data?.participant?.name,
          participantId: body.data.data?.participant?.id,
        })

        // Ensure session exists before adding transcript
        if (!transcriptStore.getSession(botId)) {
          console.log(
            `[Webhook] Auto-creating session for transcript data (bot ${botId})`,
          )
          transcriptStore.initSession(botId, {
            id: botId,
            status: 'in_call_recording',
            meeting_url: '#',
            platform: 'unknown',
            meeting_id: undefined,
          })
        }

        // Add final transcript entry from real-time transcription
        if (
          body.data.data &&
          body.data.data.words &&
          body.data.data.words.length > 0
        ) {
          const words = body.data.data.words
          const participant = body.data.data.participant

          const transcriptText = words.map((w: any) => w.text).join(' ')
          console.log(
            `[Webhook] Adding final transcript: "${transcriptText.substring(
              0,
              100,
            )}..."`,
          )

          transcriptStore.addTranscriptEntry(botId, {
            speaker:
              participant?.name ||
              `Participant ${participant?.id}` ||
              'Unknown',
            text: transcriptText,
            timestamp: new Date().toISOString(),
            confidence: 0.9, // Final transcripts are generally high confidence
            is_final: true,
            start_time: words[0]?.start_timestamp?.relative || 0,
            end_time: words[words.length - 1]?.end_timestamp?.relative || 0,
          })

          const sessionAfterAdd = transcriptStore.getSession(botId)
          console.log(`[Webhook] Session after adding final transcript:`, {
            transcriptCount: sessionAfterAdd?.transcript.length || 0,
            webhookEvents: sessionAfterAdd?.webhookEvents || 0,
          })
        } else {
          console.log(
            `[Webhook] No words found in transcript.data for bot ${botId}`,
          )
        }
        break

      case 'transcript.partial_data':
        console.log(`[Webhook] Partial transcript for bot ${botId}:`, {
          wordsCount: body.data.data?.words?.length || 0,
          participantName: body.data.data?.participant?.name,
          participantId: body.data.data?.participant?.id,
        })

        // Ensure session exists before adding transcript
        if (!transcriptStore.getSession(botId)) {
          console.log(
            `[Webhook] Auto-creating session for partial transcript data (bot ${botId})`,
          )
          transcriptStore.initSession(botId, {
            id: botId,
            status: 'in_call_recording',
            meeting_url: '#',
            platform: 'unknown',
            meeting_id: undefined,
          })
        }

        // Add partial transcript entry from real-time transcription
        if (
          body.data.data &&
          body.data.data.words &&
          body.data.data.words.length > 0
        ) {
          const words = body.data.data.words
          const participant = body.data.data.participant

          const transcriptText = words.map((w: any) => w.text).join(' ')
          console.log(
            `[Webhook] Adding partial transcript: "${transcriptText.substring(
              0,
              100,
            )}..."`,
          )

          transcriptStore.addTranscriptEntry(botId, {
            speaker:
              participant?.name ||
              `Participant ${participant?.id}` ||
              'Unknown',
            text: transcriptText,
            timestamp: new Date().toISOString(),
            confidence: 0.8, // Partial transcripts are generally lower confidence
            is_final: false,
            start_time: words[0]?.start_timestamp?.relative || 0,
            end_time: words[words.length - 1]?.end_timestamp?.relative || 0,
          })

          const sessionAfterAdd = transcriptStore.getSession(botId)
          console.log(`[Webhook] Session after adding partial transcript:`, {
            transcriptCount: sessionAfterAdd?.transcript.length || 0,
            webhookEvents: sessionAfterAdd?.webhookEvents || 0,
          })
        } else {
          console.log(
            `[Webhook] No words found in transcript.partial_data for bot ${botId}`,
          )
        }
        break

      // Legacy events - keeping for backward compatibility
      case 'bot.transcript.partial':
        console.log(
          `[Webhook] Legacy partial transcript for bot ${botId}:`,
          body.data.transcript,
        )

        // Ensure session exists
        if (!transcriptStore.getSession(botId)) {
          console.log(
            `[Webhook] Auto-creating session for legacy partial transcript (bot ${botId})`,
          )
          transcriptStore.initSession(botId, {
            id: botId,
            status: 'in_call_recording',
            meeting_url: '#',
            platform: 'unknown',
            meeting_id: undefined,
          })
        }

        // Add partial transcript entry (legacy format)
        if (body.data.transcript && body.data.transcript.words) {
          transcriptStore.addTranscriptEntry(botId, {
            speaker: body.data.transcript.speaker || 'Unknown',
            text: body.data.transcript.words.map((w: any) => w.text).join(' '),
            timestamp:
              body.data.transcript.words[0]?.start_timestamp?.absolute ||
              new Date().toISOString(),
            confidence: body.data.transcript.confidence || 0.8,
            is_final: false,
            start_time:
              body.data.transcript.words[0]?.start_timestamp?.relative || 0,
            end_time:
              body.data.transcript.words[body.data.transcript.words.length - 1]
                ?.end_timestamp?.relative || 0,
          })
        }
        break

      case 'bot.transcript.final':
        console.log(
          `[Webhook] Legacy final transcript for bot ${botId}:`,
          body.data.transcript,
        )

        // Ensure session exists
        if (!transcriptStore.getSession(botId)) {
          console.log(
            `[Webhook] Auto-creating session for legacy final transcript (bot ${botId})`,
          )
          transcriptStore.initSession(botId, {
            id: botId,
            status: 'in_call_recording',
            meeting_url: '#',
            platform: 'unknown',
            meeting_id: undefined,
          })
        }

        // Add final transcript entry (legacy format)
        if (body.data.transcript && body.data.transcript.words) {
          transcriptStore.addTranscriptEntry(botId, {
            speaker: body.data.transcript.speaker || 'Unknown',
            text: body.data.transcript.words.map((w: any) => w.text).join(' '),
            timestamp:
              body.data.transcript.words[0]?.start_timestamp?.absolute ||
              new Date().toISOString(),
            confidence: body.data.transcript.confidence || 0.9,
            is_final: true,
            start_time:
              body.data.transcript.words[0]?.start_timestamp?.relative || 0,
            end_time:
              body.data.transcript.words[body.data.transcript.words.length - 1]
                ?.end_timestamp?.relative || 0,
          })
        }
        break

      case 'recording.status_change':
        console.log(
          `[Webhook] Recording ${body.data.recording.id} status changed to: ${body.data.status_change.code}`,
        )
        break

      default:
        console.log(`[Webhook] Unhandled event: ${body.event}`)
    }

    // Log final state for debugging
    const finalSession = transcriptStore.getSession(botId)
    console.log(`[Webhook] Final session state for bot ${botId}:`, {
      exists: !!finalSession,
      transcriptCount: finalSession?.transcript.length || 0,
      webhookEvents: finalSession?.webhookEvents || 0,
      status: finalSession?.bot.status,
      lastUpdated: finalSession?.lastUpdated,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    )
  }
}
