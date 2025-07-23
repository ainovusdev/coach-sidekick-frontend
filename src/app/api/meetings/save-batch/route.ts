import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { databaseSaveService } from '@/lib/database-save-service'

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
}

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth (optional for webhook calls)
    const authHeader = request.headers.get('authorization')
    let user = null
    let authenticatedSupabase = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)

      // Create authenticated Supabase client for RLS
      authenticatedSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        },
      )

      const {
        data: { user: authUser },
        error: authError,
      } = await authenticatedSupabase.auth.getUser()

      if (!authError && authUser) {
        user = authUser
      }
    }

    const { botId, entries }: TranscriptBatch = await request.json()

    if (!botId || !entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'botId and entries are required' },
        { status: 400 },
      )
    }

    // Use the database save service with authenticated client if available
    const result = await databaseSaveService.saveTranscriptBatch(
      botId,
      entries,
      user?.id,
      authenticatedSupabase || undefined, // Pass authenticated client if available
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save transcript batch' },
        { status: 500 },
      )
    }

    console.log(
      `Saved transcript batch for session ${result.sessionId}: ${result.savedCount} new entries (total: ${result.totalSaved})`,
    )

    return NextResponse.json({
      success: true,
      message: 'Transcript batch saved successfully',
      savedCount: result.savedCount,
      totalSaved: result.totalSaved,
      sessionId: result.sessionId,
    })
  } catch (error) {
    console.error('Error in save-batch endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
