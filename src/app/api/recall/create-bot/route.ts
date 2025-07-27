import { NextRequest, NextResponse } from 'next/server'
import { transcriptStore } from '@/lib/transcript-store'
import { createClient } from '@supabase/supabase-js'
import { personalAIClient } from '@/services/personal-ai-client'
import {
  getRecallHeaders,
  config,
  getWebhookUrl,
  isConfigured,
} from '@/lib/config'

export async function POST(request: NextRequest) {
  console.log('[CREATE-BOT] Request received at', new Date().toISOString())

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
    console.log('[CREATE-BOT] Request data:', { meeting_url, client_id })

    if (!meeting_url) {
      return NextResponse.json(
        { error: 'Meeting URL is required' },
        { status: 400 },
      )
    }

    // Validate client_id if provided (using authenticated client for RLS)
    if (client_id) {
      const { data: client, error: clientError } = await authenticatedSupabase
        .from('clients')
        .select('id, coach_id, name')
        .eq('id', client_id)
        .single()

      if (clientError || !client) {
        return NextResponse.json(
          {
            error: 'Invalid client ID or client not found',
          },
          { status: 400 },
        )
      }
    }

    const webhookUrl = getWebhookUrl()
    console.log('WEBHOOK URL is', webhookUrl)

    // Create bot with Recall.ai API with real-time transcription
    console.log('[CREATE-BOT] Calling Recall API...')
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
    console.log('[CREATE-BOT] Bot created successfully:', botData.id)

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

    // Initialize session in transcript store with Personal AI configuration
    transcriptStore.initSession(
      botData.id,
      {
        id: botData.id,
        status: botData.status_changes?.[0]?.code || 'created',
        meeting_url: meeting_url,
        platform: botData.meeting_url?.platform,
        meeting_id: botData.meeting_url?.meeting_id,
      },
      {
        clientId: client_id,
        uploadToPersonalAI: true, // Default to true for new sessions
      },
    )

    // Set Personal AI session ID for client continuity
    if (client_id) {
      const personalAISessionId = personalAIClient.generateClientSessionId(
        client_id,
        botData.id,
      )
      transcriptStore.setPersonalAISessionId(botData.id, personalAISessionId)
      console.log(
        `[CREATE-BOT] Personal AI session ID set: ${personalAISessionId}`,
      )
    }

    console.log('[CREATE-BOT] Success - returning bot data')
    return NextResponse.json(botData)
  } catch (error) {
    console.error('[CREATE-BOT] Error:', error)
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
