import axios from 'axios'
import { NextRequest } from 'next/server'

const RECALL_API_KEY = 'e69f1ec2e80b30e64e5e66f923b273bf62c93c0d'
const RECALL_BASE_URL = 'https://us-west-2.recall.ai/api/v1'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    const { botId } = await params

    const response = await axios.get(`${RECALL_BASE_URL}/bot/${botId}`, {
      headers: {
        Authorization: `Token ${RECALL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(
      '[Bot Info] Full bot response:',
      JSON.stringify(response.data, null, 2),
    )

    return Response.json({
      success: true,
      bot: response.data,
    })
  } catch (error: any) {
    console.error('[Bot Info] Error:', error.response?.data || error.message)

    return Response.json(
      {
        success: false,
        error: error.response?.data || error.message,
      },
      { status: error.response?.status || 500 },
    )
  }
}
