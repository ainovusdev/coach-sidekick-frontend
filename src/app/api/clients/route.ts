import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
// import { Client } from '@/types/meeting' // Used in response types

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

    // Create an authenticated Supabase client with the JWT token
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query using authenticated client
    let query = authenticatedSupabase
      .from('clients')
      .select(
        `
        id,
        coach_id,
        name,
        email,
        phone,
        company,
        position,
        notes,
        tags,
        status,
        created_at,
        updated_at
      `,
      )
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`,
      )
    }

    const { data: clients, error } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 },
      )
    }

    // Fetch stats for each client separately to avoid join issues
    const clientsWithStats = await Promise.all(
      clients.map(async client => {
        try {
          const { data: stats } = await authenticatedSupabase
            .from('client_session_stats')
            .select(
              'total_sessions, total_duration_minutes, last_session_date, average_engagement_score, average_overall_score',
            )
            .eq('client_id', client.id)
            .single()

          return {
            ...client,
            client_session_stats: stats ? [stats] : [],
          }
        } catch {
          // If stats don't exist yet, return client without stats
          return {
            ...client,
            client_session_stats: [],
          }
        }
      }),
    )

    // Get total count for pagination using authenticated client
    let countQuery = authenticatedSupabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', user.id)

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    if (search) {
      countQuery = countQuery.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`,
      )
    }

    const { count } = await countQuery

    return NextResponse.json({
      clients: clientsWithStats,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error('Error in clients API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Create an authenticated Supabase client with the JWT token
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

    // Parse request body
    const body = await request.json()
    const { name, email, phone, company, position, notes, tags, status } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 },
      )
    }

    // Check for duplicate email if provided - use authenticated client
    if (email) {
      const { data: existing } = await authenticatedSupabase
        .from('clients')
        .select('id')
        .eq('coach_id', user.id)
        .eq('email', email.toLowerCase())
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Client with this email already exists' },
          { status: 409 },
        )
      }
    }

    // Create client - use authenticated client
    const clientData = {
      coach_id: user.id,
      name: name.trim(),
      email: email?.toLowerCase() || null,
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      position: position?.trim() || null,
      notes: notes?.trim() || null,
      tags: tags || [],
      status: status || 'active',
    }

    const { data: client, error } = await authenticatedSupabase
      .from('clients')
      .insert(clientData)
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 },
      )
    }

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error('Error in clients POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
