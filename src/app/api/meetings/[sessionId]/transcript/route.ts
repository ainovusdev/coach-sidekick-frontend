import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    // Get user from Supabase auth
    const authHeader = request.headers.get('authorization')
    let user = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser(token)
      if (!authError && authUser) {
        user = authUser
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    const { sessionId } = await params

    // Verify user owns this session
    const { data: session, error: sessionError } = await supabase
      .from('coaching_sessions')
      .select('id, bot_id, meeting_url, status, created_at')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 },
      )
    }

    // Get transcript entries
    const { data: transcriptEntries, error: transcriptError } = await supabase
      .from('transcript_entries')
      .select('*')
      .eq('coaching_session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (transcriptError) {
      console.error('Error fetching transcript:', transcriptError)
      return NextResponse.json(
        { error: 'Failed to fetch transcript' },
        { status: 500 },
      )
    }

    // Get coaching analysis if available
    const { data: analysis, error: analysisError } = await supabase
      .from('coaching_analyses')
      .select('*')
      .eq('coaching_session_id', sessionId)
      .single()

    if (analysisError && analysisError.code !== 'PGRST116') {
      console.error('Error fetching analysis:', analysisError)
    }

    return NextResponse.json({
      session,
      transcript: transcriptEntries || [],
      analysis: analysis || null,
      stats: {
        totalEntries: transcriptEntries?.length || 0,
        speakers: [
          ...new Set(transcriptEntries?.map(entry => entry.speaker) || []),
        ],
        duration: analysis ? null : null, // Could calculate from transcript timestamps
      },
    })
  } catch (error) {
    console.error('Error in transcript endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
