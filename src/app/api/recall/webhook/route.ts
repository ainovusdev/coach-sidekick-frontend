import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Log the incoming webhook for debugging
    console.log('[Webhook] Received webhook request')
    
    // Parse the request body
    const body = await request.json()
    
    // Simply forward the webhook to the backend
    // The backend URL should be configured to receive webhooks directly
    // This route is kept for compatibility but ideally webhooks should go directly to backend
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const webhookUrl = `${backendUrl}/api/v1/webhooks/recall/transcript`
    
    console.log(`[Webhook] Forwarding to backend: ${webhookUrl}`)
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const responseData = await response.json()
    
    if (response.ok) {
      console.log(`[Webhook] Successfully forwarded to backend`)
      return NextResponse.json(responseData)
    } else {
      console.error(`[Webhook] Backend returned error:`, responseData)
      return NextResponse.json(responseData, { status: response.status })
    }
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Webhook endpoint is active' })
}