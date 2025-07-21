import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get coaching sessions with meeting summaries
    const { data: meetings, error } = await supabase
      .from('coaching_sessions')
      .select(
        `
        id,
        bot_id,
        meeting_url,
        status,
        created_at,
        updated_at,
        metadata,
        meeting_summaries (
          duration_minutes,
          total_transcript_entries,
          total_coaching_suggestions,
          final_overall_score,
          final_conversation_phase,
          key_insights,
          action_items,
          meeting_summary
        )
      `,
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching meeting history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch meeting history' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      meetings: meetings || [],
      pagination: {
        limit,
        offset,
        hasMore: meetings?.length === limit,
      },
    })
  } catch (error) {
    console.error('Error in meeting history endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
