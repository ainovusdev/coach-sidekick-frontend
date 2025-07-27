import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
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

    const { sessionId } = await params

    console.log(
      `[DEBUG] Fetching session details for: ${sessionId}, user: ${user.id}`,
    )

    // Verify user owns this session and get full session details
    const { data: session, error: sessionError } = await authenticatedSupabase
      .from('coaching_sessions')
      .select(
        'id, bot_id, meeting_url, status, created_at, updated_at, metadata',
      )
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      console.log(`[DEBUG] Session not found or access denied:`, sessionError)
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 },
      )
    }

    console.log(`[DEBUG] Found session:`, session.id)

    // Get transcript entries
    const { data: transcriptEntries, error: transcriptError } =
      await authenticatedSupabase
        .from('transcript_entries')
        .select('id, speaker, text, timestamp, confidence, created_at')
        .eq('coaching_session_id', sessionId)
        .order('created_at', { ascending: true })

    if (transcriptError) {
      console.error('Error fetching transcript:', transcriptError)
      return NextResponse.json(
        { error: 'Failed to fetch transcript' },
        { status: 500 },
      )
    }

    console.log(
      `[DEBUG] Found ${transcriptEntries?.length || 0} transcript entries`,
    )

    // Get coaching analyses (as array to match frontend expectation)
    const { data: coachingAnalyses, error: analysisError } =
      await authenticatedSupabase
        .from('coaching_analyses')
        .select(
          'id, overall_score, conversation_phase, key_suggestions, improvement_areas, positive_feedback, analysis_data, created_at',
        )
        .eq('coaching_session_id', sessionId)
        .order('created_at', { ascending: true })

    if (analysisError && analysisError.code !== 'PGRST116') {
      console.error('Error fetching coaching analyses:', analysisError)
    }

    console.log(
      `[DEBUG] Found ${coachingAnalyses?.length || 0} coaching analyses`,
    )

    // Get meeting summary
    const { data: meetingSummary, error: summaryError } =
      await authenticatedSupabase
        .from('meeting_summaries')
        .select(
          'id, duration_minutes, total_transcript_entries, total_coaching_suggestions, final_overall_score, final_conversation_phase, key_insights, action_items, meeting_summary, created_at',
        )
        .eq('coaching_session_id', sessionId)
        .single()

    if (summaryError && summaryError.code !== 'PGRST116') {
      console.error('Error fetching meeting summary:', summaryError)
    }

    console.log(`[DEBUG] Meeting summary found:`, !!meetingSummary)

    // Return data structure that matches frontend expectations
    return NextResponse.json({
      session,
      transcript: transcriptEntries || [],
      coaching_analyses: coachingAnalyses || [],
      meeting_summary: meetingSummary || null,
    })
  } catch (error) {
    console.error('Error in transcript endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
