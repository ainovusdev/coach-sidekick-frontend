import { NextRequest, NextResponse } from 'next/server'
import { transcriptStore } from '@/lib/transcript-store'

// This webhook will receive real-time transcript events from Recall.ai
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Webhook] Received:', JSON.stringify(body, null, 2))

    // Handle different webhook events
    switch (body.event) {
      case 'bot.status_change':
        console.log(
          `[Webhook] Bot ${body.data.bot.id} status changed to: ${body.data.status_change.code}`,
        )

        // Initialize session if it doesn't exist
        if (!transcriptStore.getSession(body.data.bot.id)) {
          transcriptStore.initSession(body.data.bot.id, {
            id: body.data.bot.id,
            status: body.data.status_change.code,
            meeting_url: body.data.bot.meeting_url || '#',
            platform: body.data.bot.meeting_url?.platform,
            meeting_id: body.data.bot.meeting_url?.meeting_id,
          })
        } else {
          // Update bot status
          transcriptStore.updateBotStatus(
            body.data.bot.id,
            body.data.status_change.code,
          )
        }
        break

      case 'transcript.data':
        console.log(
          `[Webhook] Final transcript for bot ${body.data.bot.id}:`,
          body.data.data,
        )

        // Add final transcript entry from real-time transcription
        if (
          body.data.data &&
          body.data.data.words &&
          body.data.data.words.length > 0
        ) {
          const words = body.data.data.words
          const participant = body.data.data.participant

          transcriptStore.addTranscriptEntry(body.data.bot.id, {
            speaker:
              participant?.name ||
              `Participant ${participant?.id}` ||
              'Unknown',
            text: words.map((w: any) => w.text).join(' '),
            timestamp: new Date().toISOString(),
            confidence: 0.9, // Final transcripts are generally high confidence
            is_final: true,
            start_time: words[0]?.start_timestamp?.relative || 0,
            end_time: words[words.length - 1]?.end_timestamp?.relative || 0,
          })
        }
        break

      case 'transcript.partial_data':
        console.log(
          `[Webhook] Partial transcript for bot ${body.data.bot.id}:`,
          body.data.data,
        )

        // Add partial transcript entry from real-time transcription
        if (
          body.data.data &&
          body.data.data.words &&
          body.data.data.words.length > 0
        ) {
          const words = body.data.data.words
          const participant = body.data.data.participant

          transcriptStore.addTranscriptEntry(body.data.bot.id, {
            speaker:
              participant?.name ||
              `Participant ${participant?.id}` ||
              'Unknown',
            text: words.map((w: any) => w.text).join(' '),
            timestamp: new Date().toISOString(),
            confidence: 0.8, // Partial transcripts are generally lower confidence
            is_final: false,
            start_time: words[0]?.start_timestamp?.relative || 0,
            end_time: words[words.length - 1]?.end_timestamp?.relative || 0,
          })
        }
        break

      // Legacy events - keeping for backward compatibility
      case 'bot.transcript.partial':
        console.log(
          `[Webhook] Legacy partial transcript for bot ${body.data.bot.id}:`,
          body.data.transcript,
        )

        // Add partial transcript entry (legacy format)
        if (body.data.transcript && body.data.transcript.words) {
          transcriptStore.addTranscriptEntry(body.data.bot.id, {
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
          `[Webhook] Legacy final transcript for bot ${body.data.bot.id}:`,
          body.data.transcript,
        )

        // Add final transcript entry (legacy format)
        if (body.data.transcript && body.data.transcript.words) {
          transcriptStore.addTranscriptEntry(body.data.bot.id, {
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    )
  }
}
