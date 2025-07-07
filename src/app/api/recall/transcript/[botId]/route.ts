import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const RECALL_API_KEY = '1c0de77d7db7ad0313d15ac7fec9dc89d57e1f47'
const RECALL_API_URL = 'https://us-west-2.recall.ai/api/v1'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    const { botId } = await params

    // Get bot details and transcript
    const response = await axios.get(`${RECALL_API_URL}/bot/${botId}`, {
      headers: {
        Authorization: `Token ${RECALL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const bot = response.data
    // console.log('Bot data from Recall.ai:', JSON.stringify(bot, null, 2))

    console.log('response', response.data)
    let transcript = []

    // Check if bot has recordings with transcript data
    if (bot.recordings && bot.recordings.length > 0) {
      const latestRecording = bot.recordings[0] // Get the most recent recording

      if (latestRecording.media_shortcuts?.transcript?.data?.download_url) {
        try {
          console.log('Fetching transcript from download URL...')
          const transcriptResponse = await axios.get(
            latestRecording.media_shortcuts.transcript.data.download_url,
            {
              headers: {
                Authorization: `Token ${RECALL_API_KEY}`,
              },
            },
          )

          if (
            transcriptResponse.data &&
            Array.isArray(transcriptResponse.data)
          ) {
            console.log(
              `Found ${transcriptResponse.data.length} transcript entries`,
            )

            // Parse the Recall.ai transcript format
            transcript = transcriptResponse.data.map((entry: any) => ({
              speaker: entry.participant?.name || 'Unknown Speaker',
              text: entry.words?.map((w: any) => w.text).join(' ') || '',
              timestamp:
                entry.words?.[0]?.start_timestamp?.absolute ||
                new Date().toISOString(),
              start_time: entry.words?.[0]?.start_timestamp?.relative || 0,
              end_time:
                entry.words?.[entry.words?.length - 1]?.end_timestamp
                  ?.relative || 0,
              confidence: 0.9,
            }))
          }
        } catch (transcriptError) {
          console.error(
            'Error fetching transcript from download URL:',
            transcriptError,
          )
        }
      } else {
        console.log('No transcript download URL found in recordings yet')
      }
    }

    // Fallback: Check for other transcript sources
    if (
      transcript.length === 0 &&
      bot.transcript_chunks &&
      Array.isArray(bot.transcript_chunks)
    ) {
      console.log('Found transcript chunks:', bot.transcript_chunks.length)
      transcript = bot.transcript_chunks.map(
        (chunk: Record<string, unknown>) => ({
          speaker: chunk.speaker || 'Unknown',
          text: chunk.text || '',
          timestamp: chunk.timestamp || new Date().toISOString(),
          confidence: chunk.confidence || 0.9,
        }),
      )
    }

    // Get current status from status_changes if available
    const currentStatus =
      bot.status_changes && bot.status_changes.length > 0
        ? bot.status_changes[bot.status_changes.length - 1].code
        : 'unknown'

    const result = {
      bot: {
        id: bot.id,
        status: currentStatus,
        meeting_url: bot.meeting_url,
        platform: bot.meeting_url?.platform,
        meeting_id: bot.meeting_url?.meeting_id,
      },
      transcript,
      debug: {
        transcriptCount: transcript.length,
        hasRecordings: !!(bot.recordings && bot.recordings.length > 0),
        hasTranscriptUrl:
          !!bot.recordings?.[0]?.media_shortcuts?.transcript?.data
            ?.download_url,
        currentStatus,
        statusChanges: bot.status_changes?.map((sc: any) => sc.code) || [],
        recordingStatus:
          bot.recordings?.[0]?.media_shortcuts?.transcript?.status?.code,
      },
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const axiosError = error as any
    console.error(
      'Error fetching transcript:',
      axiosError.response?.data || axiosError.message,
    )

    return NextResponse.json(
      {
        error: 'Failed to fetch transcript',
        details: axiosError.response?.data?.message || axiosError.message,
      },
      { status: 500 },
    )
  }
}
