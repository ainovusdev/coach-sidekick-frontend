import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth
    const authHeader = request.headers.get('authorization')
    let user = null
    let authToken = null

    if (authHeader?.startsWith('Bearer ')) {
      authToken = authHeader.substring(7)
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser(authToken)
      if (!authError && authUser) {
        user = authUser
      }
    }

    if (!user || !authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create an authenticated Supabase client
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

    const { data: profile, error } = await authenticatedSupabase
      .from('profiles')
      .select('coaching_preference')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching coaching preference:', error)
      return NextResponse.json(
        { error: 'Failed to fetch coaching preference' },
        { status: 500 }
      )
    }

    return NextResponse.json({ coaching_preference: profile?.coaching_preference })
  } catch (error) {
    console.error('Error in GET /api/profile/coaching-preference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user from Supabase auth
    const authHeader = request.headers.get('authorization')
    let user = null
    let authToken = null

    if (authHeader?.startsWith('Bearer ')) {
      authToken = authHeader.substring(7)
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser(authToken)
      if (!authError && authUser) {
        user = authUser
      }
    }

    if (!user || !authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create an authenticated Supabase client
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

    const body = await request.json()
    const { coaching_preference } = body

    if (!coaching_preference || typeof coaching_preference !== 'string') {
      return NextResponse.json(
        { error: 'Invalid coaching preference' },
        { status: 400 }
      )
    }

    const { data, error } = await authenticatedSupabase
      .from('profiles')
      .update({ 
        coaching_preference,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating coaching preference:', error)
      return NextResponse.json(
        { error: 'Failed to update coaching preference' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      coaching_preference: data?.coaching_preference 
    })
  } catch (error) {
    console.error('Error in PUT /api/profile/coaching-preference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}