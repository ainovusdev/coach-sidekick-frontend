import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const RECALL_API_KEY = 'e69f1ec2e80b30e64e5e66f923b273bf62c93c0d'
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

    // Create bot with Recall.ai API
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
        },
      },
      {
        headers: {
          Authorization: `Token ${RECALL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    )

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const axiosError = error as any
    console.error(
      'Error creating bot:',
      axiosError.response?.data || axiosError.message,
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
