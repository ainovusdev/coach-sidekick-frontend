import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log(
      `[DEBUG] Fetching meetings for user: ${user.id}, limit: ${limit}, offset: ${offset}`,
    )

    // Get coaching sessions with meeting summaries (using authenticated client)
    const { data: meetings, error } = await authenticatedSupabase
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

    console.log(
      `[DEBUG] Found ${meetings?.length || 0} meetings for user ${user.id}`,
    )

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
