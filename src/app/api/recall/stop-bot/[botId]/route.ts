import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const RECALL_API_KEY = '1c0de77d7db7ad0313d15ac7fec9dc89d57e1f47'
const RECALL_API_URL = 'https://us-west-2.recall.ai/api/v1'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    const { botId } = await params

    // Stop the bot
    const response = await axios.post(
      `${RECALL_API_URL}/bot/${botId}/leave_call`,
      {},
      {
        headers: {
          Authorization: `Token ${RECALL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: 'Bot stopped successfully',
      bot: response.data,
    })
  } catch (error: unknown) {
    const axiosError = error as any
    console.error(
      'Error stopping bot:',
      axiosError.response?.data || axiosError.message,
    )

    return NextResponse.json(
      {
        error: 'Failed to stop bot',
        details: axiosError.response?.data?.message || axiosError.message,
      },
      { status: 500 },
    )
  }
}
