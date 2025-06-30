import { NextRequest, NextResponse } from 'next/server'

// This webhook will receive real-time transcript events from Recall.ai
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('Received webhook from Recall.ai:', body)

    // Process the webhook event
    if (
      body.event === 'transcript.completed' ||
      body.event === 'transcript.updated'
    ) {
      // Handle real-time transcript updates
      // You could store this in a database or push to connected clients via WebSocket
      console.log('Transcript update:', body.data)
    }

    if (body.event === 'bot.status_change') {
      console.log('Bot status changed:', body.data)
    }

    // Acknowledge receipt of the webhook
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 },
    )
  }
}
