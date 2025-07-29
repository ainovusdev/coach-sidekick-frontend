import { NextRequest, NextResponse } from 'next/server'
import { transcriptStore } from '@/lib/transcript-store'
import { personalAIClient } from '@/services/personal-ai-client'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let sessionId: string = 'unknown'
  try {
    const paramsData = await params
    sessionId = paramsData.sessionId

    // Get user from Supabase auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const authToken = authHeader.substring(7)

    // Create authenticated Supabase client
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      }
    )

    // Verify the user
    const {
      data: { user },
      error: authError,
    } = await authenticatedSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify session ownership
    const { data: coachingSession, error: sessionError } = await authenticatedSupabase
      .from('coaching_sessions')
      .select('bot_id, client_id')
      .eq('bot_id', sessionId)
      .single()

    if (sessionError || !coachingSession) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // Get Personal AI information from transcript store
    const personalAIInfo = transcriptStore.getPersonalAIInfo(sessionId)
    
    // Check Personal AI service health
    const personalAIHealthy = await personalAIClient.healthCheck()

    return NextResponse.json({
      sessionId,
      personalAI: {
        configured: !!(process.env.PERSONAL_AI_API_KEY && process.env.PERSONAL_AI_DOMAIN_NAME),
        healthy: personalAIHealthy,
        uploadEnabled: personalAIInfo?.uploadToPersonalAI || false,
        uploaded: personalAIInfo?.personalAIUploaded || false,
        lastUpload: personalAIInfo?.lastPersonalAIUpload,
        sessionId: personalAIInfo?.personalAISessionId,
        clientId: personalAIInfo?.clientId,
      },
      session: {
        hasTranscript: !!transcriptStore.getSession(sessionId),
        transcriptEntries: transcriptStore.getSession(sessionId)?.transcript.length || 0,
        finalEntries: transcriptStore.getSession(sessionId)?.transcript.filter(e => e.is_final).length || 0,
      }
    })
  } catch (error) {
    console.error(`[Personal AI Status] Error for session ${sessionId}:`, error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}