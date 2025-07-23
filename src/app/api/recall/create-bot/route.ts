import { NextRequest, NextResponse } from 'next/server'
import { transcriptStore } from '@/lib/transcript-store'
import { createClient } from '@supabase/supabase-js'
import {
  getRecallHeaders,
  config,
  getWebhookUrl,
  isConfigured,
} from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    // Check if the app is properly configured
    if (!isConfigured()) {
      return NextResponse.json(
        {
          error: 'Application not configured',
          message:
            'RECALL_API_KEY is missing. Please check your environment variables.',
        },
        { status: 500 },
      )
    }

    // Get user from Supabase auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    const authToken = authHeader.substring(7)

    // Create authenticated Supabase client for RLS
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      },
    )

    // Verify the user
    const {
      data: { user },
      error: authError,
    } = await authenticatedSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    const { meeting_url, client_id } = await request.json()

    if (!meeting_url) {
      return NextResponse.json(
        { error: 'Meeting URL is required' },
        { status: 400 },
      )
    }

    // Validate client_id if provided (using authenticated client for RLS)
    if (client_id) {
      console.log(
        `[DEBUG] Validating client_id: ${client_id} for user: ${user.id}`,
      )

      const { data: client, error: clientError } = await authenticatedSupabase
        .from('clients')
        .select('id, coach_id, name')
        .eq('id', client_id)
        .single()

      console.log(`[DEBUG] Client query result:`, { client, clientError })

      if (clientError || !client) {
        console.log(
          `[DEBUG] Client validation failed - client not found or not owned by user`,
        )

        return NextResponse.json(
          {
            error: 'Invalid client ID or client not found',
            debug: {
              clientId: client_id,
              userId: user.id,
              authError: clientError?.message,
            },
          },
          { status: 400 },
        )
      }

      console.log(`[DEBUG] Client validation successful for: ${client.name}`)
    }

    const webhookUrl = getWebhookUrl()
    console.log('WEBHOOK URL is', webhookUrl)

    // Create bot with Recall.ai API with real-time transcription
    const response = await fetch(`${config.recall.apiUrl}/bot`, {
      method: 'POST',
      headers: getRecallHeaders(),
      body: JSON.stringify({
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
              url: webhookUrl,
              events: ['transcript.data', 'transcript.partial_data'],
            },
          ],
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Failed to create bot: ${errorData.message || response.statusText}`,
      )
    }

    const botData = await response.json()

    // Save coaching session to database (using authenticated client)
    const { error: dbError } = await authenticatedSupabase
      .from('coaching_sessions')
      .insert({
        user_id: user.id,
        bot_id: botData.id,
        meeting_url: meeting_url,
        client_id: client_id || null,
        status: botData.status_changes?.[0]?.code || 'created',
        metadata: {
          platform: botData.meeting_url?.platform,
          meeting_id: botData.meeting_url?.meeting_id,
          recall_bot_data: botData,
        },
      })

    if (dbError) {
      console.error('Error saving session to database:', dbError)
      // Continue anyway - the bot was created successfully
    }

    // Initialize session in transcript store
    transcriptStore.initSession(botData.id, {
      id: botData.id,
      status: botData.status_changes?.[0]?.code || 'created',
      meeting_url: meeting_url,
      platform: botData.meeting_url?.platform,
      meeting_id: botData.meeting_url?.meeting_id,
    })

    return NextResponse.json(botData)
  } catch (error) {
    if (error instanceof Error && error.message.includes('RECALL_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Configuration error',
          message: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create bot',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
