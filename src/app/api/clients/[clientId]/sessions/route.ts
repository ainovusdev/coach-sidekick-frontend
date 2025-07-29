import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verify client belongs to user
    const { error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('coach_id', user.id)
      .single()

    if (clientError) {
      if (clientError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to verify client access' }, { status: 500 })
    }

    // Fetch client sessions with summaries and analyses
    const { data: sessions, error } = await supabase
      .from('coaching_sessions')
      .select(`
        id,
        bot_id,
        meeting_url,
        status,
        created_at,
        updated_at,
        meeting_summaries (
          duration_minutes,
          total_transcript_entries,
          final_overall_score,
          final_conversation_phase,
          key_insights,
          meeting_summary
        ),
        coaching_analyses (
          overall_score,
          coach_energy_level,
          client_engagement_level,
          conversation_phase,
          created_at
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching client sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch client sessions' }, { status: 500 })
    }

    // Get total count
    const { count } = await supabase
      .from('coaching_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    return NextResponse.json({
      sessions,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Error in client sessions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}