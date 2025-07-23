import { NextRequest, NextResponse } from 'next/server'
import { transcriptStore } from '@/lib/transcript-store'
import { coachingAnalysisService } from '@/lib/coaching-analysis'
import { databaseSaveService } from '@/lib/database-save-service'

// Async function to trigger coaching analysis without blocking webhook response
async function triggerCoachingAnalysis(botId: string) {
  try {
    // Only analyze if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return
    }

    const session = transcriptStore.getSession(botId)
    if (!session || session.transcript.length < 3) {
      return // Need at least some conversation to analyze
    }

    const lastAnalysis = coachingAnalysisService.getLatestAnalysis(botId)
    const lastAnalyzedIndex = lastAnalysis?.lastAnalyzedTranscriptIndex || 0

    // Only analyze if there are at least 3 new entries since last analysis
    if (session.transcript.length < lastAnalyzedIndex + 3) {
      return
    }

    // Trigger analysis asynchronously
    await coachingAnalysisService.analyzeConversation(
      botId,
      session.transcript,
      lastAnalyzedIndex,
    )

    console.log(
      `[Coaching] Analysis triggered for bot ${botId}, ${
        session.transcript.length - lastAnalyzedIndex
      } new entries`,
    )
  } catch (error) {
    console.error(`[Coaching] Analysis failed for bot ${botId}:`, error)
  }
}

// Async function to trigger batch save without blocking webhook response
async function triggerBatchSave(botId: string) {
  try {
    const sessionData = transcriptStore.getSession(botId)
    if (!sessionData || sessionData.transcript.length === 0) {
      return
    }

    // Use the database save service directly (webhook context - no authentication)
    const result = await databaseSaveService.saveTranscriptBatch(
      botId,
      sessionData.transcript,
      undefined, // No userId for webhook context
      undefined, // No authenticated client for webhook context
    )

    if (result.success) {
      // Mark entries as saved in the transcript store
      transcriptStore.markEntriesAsSaved(botId, result.savedCount)
      console.log(
        `[Webhook] Batch saved for ${botId}: ${result.savedCount} entries`,
      )
    } else {
      console.error(`[Webhook] Batch save failed for ${botId}:`, result.error)
    }
  } catch (error) {
    console.error(`[Webhook] Batch save failed for ${botId}:`, error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const botId = body.data?.bot?.id
    if (!botId) {
      return NextResponse.json({ error: 'No bot ID provided' }, { status: 400 })
    }

    switch (body.event) {
      case 'bot.status_change':
        const existingSession = transcriptStore.getSession(botId)
        if (!existingSession) {
          transcriptStore.initSession(botId, {
            id: botId,
            status: body.data.status_change.code,
            meeting_url: body.data.bot.meeting_url || '#',
            platform: body.data.bot.meeting_url?.platform,
            meeting_id: body.data.bot.meeting_url?.meeting_id,
          })
        } else {
          transcriptStore.updateBotStatus(botId, body.data.status_change.code)
        }
        break

      case 'transcript.data':
        if (!transcriptStore.getSession(botId)) {
          transcriptStore.initSession(botId, {
            id: botId,
            status: 'in_call_recording',
            meeting_url: '#',
            platform: 'unknown',
            meeting_id: undefined,
          })
        }

        if (
          body.data.data &&
          body.data.data.words &&
          body.data.data.words.length > 0
        ) {
          const words = body.data.data.words
          const participant = body.data.data.participant

          const transcriptText = words.map((w: any) => w.text).join(' ')

          transcriptStore.addTranscriptEntry(botId, {
            speaker:
              participant?.name ||
              `Participant ${participant?.id}` ||
              'Unknown',
            text: transcriptText,
            timestamp: new Date().toISOString(),
            confidence: 0.9,
            is_final: true,
            start_time: words[0]?.start_timestamp?.relative || 0,
            end_time: words[words.length - 1]?.end_timestamp?.relative || 0,
          })

          // Trigger coaching analysis for final transcript data
          setImmediate(() => triggerCoachingAnalysis(botId))

          // Check if we should trigger a batch save
          if (transcriptStore.shouldTriggerBatchSave(botId)) {
            setImmediate(() => triggerBatchSave(botId))
          }
        }
        break

      case 'transcript.partial_data':
        if (!transcriptStore.getSession(botId)) {
          transcriptStore.initSession(botId, {
            id: botId,
            status: 'in_call_recording',
            meeting_url: '#',
            platform: 'unknown',
            meeting_id: undefined,
          })
        }

        if (
          body.data.data &&
          body.data.data.words &&
          body.data.data.words.length > 0
        ) {
          const words = body.data.data.words
          const participant = body.data.data.participant

          const transcriptText = words.map((w: any) => w.text).join(' ')

          transcriptStore.addTranscriptEntry(botId, {
            speaker:
              participant?.name ||
              `Participant ${participant?.id}` ||
              'Unknown',
            text: transcriptText,
            timestamp: new Date().toISOString(),
            confidence: 0.8,
            is_final: false,
            start_time: words[0]?.start_timestamp?.relative || 0,
            end_time: words[words.length - 1]?.end_timestamp?.relative || 0,
          })
        }
        break

      case 'bot.transcript.final':
        if (!transcriptStore.getSession(botId)) {
          transcriptStore.initSession(botId, {
            id: botId,
            status: 'in_call_recording',
            meeting_url: '#',
            platform: 'unknown',
            meeting_id: undefined,
          })
        }

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

          // Trigger coaching analysis for final transcript data
          setImmediate(() => triggerCoachingAnalysis(botId))

          // Check if we should trigger a batch save
          if (transcriptStore.shouldTriggerBatchSave(botId)) {
            setImmediate(() => triggerBatchSave(botId))
          }
        }
        break

      case 'recording.status_change':
        break

      default:
        break
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    )
  }
}
