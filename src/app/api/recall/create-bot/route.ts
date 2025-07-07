import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { transcriptStore } from '@/lib/transcript-store'

const RECALL_API_KEY = '1c0de77d7db7ad0313d15ac7fec9dc89d57e1f47'
const RECALL_API_URL = 'https://us-west-2.recall.ai/api/v1'

export async function POST(request: NextRequest) {
  try {
    const { meeting_url } = await request.json()

    if (!meeting_url) {
      return NextResponse.json(
        { error: 'Meeting URL is required' },
        { status: 400 },
      )
    }

    // Get the base URL for the webhook
    const baseUrl =
      process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000')

    console.log('recall webhook is ', {
      realtime_endpoints: [
        {
          type: 'webhook',
          // url: `${baseUrl}/api/recall/webhook`,
          url: 'https://4b99-103-218-26-197.ngrok-free.app/api/recall/webhook',
          events: ['transcript.data', 'transcript.partial_data'],
        },
      ],
    })
    // Create bot with Recall.ai API with real-time transcription
    const response = await axios.post(
      `${RECALL_API_URL}/bot`,
      {
        meeting_url,
        recording_config: {
          transcript: {
            provider: {
              meeting_captions: {},
            },
          },
          realtime_endpoints: [
            {
              type: 'webhook',
              // url: `${baseUrl}/api/recall/webhook`,
              url: 'https://4b99-103-218-26-197.ngrok-free.app/api/recall/webhook',
              events: ['transcript.data', 'transcript.partial_data'],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Token ${RECALL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    )

    // Initialize session in transcript store
    const botData = response.data
    transcriptStore.initSession(botData.id, {
      id: botData.id,
      status: botData.status_changes?.[0]?.code || 'created',
      meeting_url: meeting_url,
      platform: botData.meeting_url?.platform,
      meeting_id: botData.meeting_url?.meeting_id,
    })

    console.log(`[Create Bot] Initialized session for bot: ${botData.id}`)
    console.log(
      `[Create Bot] Configured real-time transcription with webhook: ${baseUrl}/api/recall/webhook`,
    )

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const axiosError = error as any
    console.error(
      'Error creating bot:',
      JSON.stringify(axiosError.response?.data) || axiosError.message,
    )

    return NextResponse.json(
      {
        error: 'Failed to create bot',
        details: axiosError.response?.data?.message || axiosError.message,
      },
      { status: 500 },
    )
  }
}
