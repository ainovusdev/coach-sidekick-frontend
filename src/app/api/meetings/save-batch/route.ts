import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface TranscriptBatch {
  botId: string
  entries: Array<{
    speaker: string
    text: string
    timestamp: string
    confidence: number
    is_final: boolean
    start_time?: number
    end_time?: number
  }>
  lastSavedIndex: number
}

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth (optional for webhook calls)
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

    const { botId, entries }: Omit<TranscriptBatch, 'lastSavedIndex'> =
      await request.json()

    if (!botId || !entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'botId and entries are required' },
        { status: 400 },
      )
    }

    // Find the coaching session
    let sessionQuery = supabase
      .from('coaching_sessions')
      .select('id, user_id, metadata')
      .eq('bot_id', botId)

    if (user) {
      sessionQuery = sessionQuery.eq('user_id', user.id)
    }

    const { data: coachingSession, error: sessionError } =
      await sessionQuery.single()

    if (sessionError || !coachingSession) {
      return NextResponse.json(
        { error: 'Coaching session not found' },
        { status: 404 },
      )
    }

    const sessionId = coachingSession.id

    // Check what's already been saved to avoid duplicates
    const { data: existingEntries } = await supabase
      .from('transcript_entries')
      .select('id')
      .eq('coaching_session_id', sessionId)
      .order('created_at', { ascending: true })

    const startingIndex = existingEntries?.length || 0

    // Only save entries that haven't been saved yet
    const newEntries = entries.slice(startingIndex).map((entry, index) => ({
      coaching_session_id: sessionId,
      speaker: entry.speaker,
      text: entry.text,
      timestamp: entry.timestamp,
      confidence: entry.confidence,
      is_final: entry.is_final,
      start_time: entry.start_time,
      end_time: entry.end_time,
      entry_index: startingIndex + index, // Track order
    }))

    if (newEntries.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new entries to save',
        savedCount: 0,
        totalSaved: startingIndex,
      })
    }

    // Save new transcript entries
    const { error: insertError } = await supabase
      .from('transcript_entries')
      .insert(newEntries)

    if (insertError) {
      console.error('Error saving transcript batch:', insertError)
      return NextResponse.json(
        { error: 'Failed to save transcript batch' },
        { status: 500 },
      )
    }

    // Update session's last activity
    const { error: updateError } = await supabase
      .from('coaching_sessions')
      .update({
        updated_at: new Date().toISOString(),
        metadata: {
          ...coachingSession.metadata,
          last_batch_save: new Date().toISOString(),
          total_transcript_entries: startingIndex + newEntries.length,
        },
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating session metadata:', updateError)
      // Don't fail the request if metadata update fails
    }

    console.log(
      `Saved transcript batch for session ${sessionId}: ${
        newEntries.length
      } new entries (total: ${startingIndex + newEntries.length})`,
    )

    return NextResponse.json({
      success: true,
      message: 'Transcript batch saved successfully',
      savedCount: newEntries.length,
      totalSaved: startingIndex + newEntries.length,
      sessionId,
    })
  } catch (error) {
    console.error('Error in save-batch endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
