import { NextRequest, NextResponse } from 'next/server'
import { transcriptStore } from '@/lib/transcript-store'
import { coachingAnalysisService } from '@/lib/coaching-analysis'
import { personalAIMemoryService } from '@/services/personal-ai-memory'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId

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

    // Get session from transcript store
    const session = transcriptStore.getSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if already uploaded
    if (transcriptStore.isPersonalAIUploaded(sessionId)) {
      return NextResponse.json({
        success: true,
        message: 'Session already uploaded to Personal AI',
        uploaded: true,
      })
    }

    // Get coaching session from database to verify ownership
    const { data: coachingSession, error: sessionError } = await authenticatedSupabase
      .from('coaching_sessions')
      .select('*, clients(*)')
      .eq('bot_id', sessionId)
      .single()

    if (sessionError || !coachingSession) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // Get the latest coaching analysis
    const coachingAnalysis = coachingAnalysisService.getLatestAnalysis(sessionId)

    // Upload to Personal AI
    const uploaded = await personalAIMemoryService.uploadCoachingSession(
      coachingSession,
      session.transcript,
      coachingAnalysis || undefined,
      coachingSession.clients || undefined
    )

    if (uploaded) {
      transcriptStore.markPersonalAIUploaded(sessionId)
      console.log(`[Personal AI API] Session ${sessionId} uploaded successfully`)
      
      return NextResponse.json({
        success: true,
        message: 'Session uploaded to Personal AI successfully',
        sessionId,
        transcriptEntries: session.transcript.filter(e => e.is_final).length,
        hasAnalysis: !!coachingAnalysis,
        clientId: session.clientId,
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to upload session to Personal AI' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error(`[Personal AI API] Upload failed for session ${params.sessionId}:`, error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}