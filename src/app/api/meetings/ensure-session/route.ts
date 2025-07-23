import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { databaseSaveService } from '@/lib/database-save-service'

export async function POST(request: NextRequest) {
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

    const { botId, sessionData } = await request.json()

    if (!botId) {
      return NextResponse.json({ error: 'botId is required' }, { status: 400 })
    }

    // Use the database save service with authenticated client to ensure session exists
    const result = await databaseSaveService.ensureSession(
      botId,
      user.id,
      sessionData,
      authenticatedSupabase, // Pass the authenticated client
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to ensure session exists' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      message: 'Session ensured successfully',
    })
  } catch (error) {
    console.error('Error in ensure-session endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
