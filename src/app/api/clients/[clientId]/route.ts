import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
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

    // Fetch client (without stats for now to avoid join issues)
    const { data: client, error } = await supabase
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
      .eq('id', clientId)
      .eq('coach_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      console.error('Error fetching client:', error)
      return NextResponse.json(
        { error: 'Failed to fetch client' },
        { status: 500 },
      )
    }

    // Fetch stats separately to avoid join issues
    const clientWithStats: any = { ...client }
    try {
      const { data: stats } = await supabase
        .from('client_session_stats')
        .select(
          'total_sessions, total_duration_minutes, last_session_date, average_engagement_score, average_overall_score, improvement_trends, coaching_focus_areas',
        )
        .eq('client_id', clientId)
        .single()

      if (stats) {
        clientWithStats.client_session_stats = [stats]
      }
    } catch {
      // Stats don't exist yet, that's fine
      clientWithStats.client_session_stats = []
    }

    return NextResponse.json({ client: clientWithStats })
  } catch (error) {
    console.error('Error in client GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
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
    const body = await request.json()
    const { name, email, phone, company, position, notes, tags, status } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 },
      )
    }

    // Check if client exists and belongs to user
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, email')
      .eq('id', clientId)
      .eq('coach_id', user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to fetch client' },
        { status: 500 },
      )
    }

    // Check for duplicate email if email is being changed
    if (email && email.toLowerCase() !== existingClient.email) {
      const { data: duplicateClient } = await supabase
        .from('clients')
        .select('id')
        .eq('coach_id', user.id)
        .eq('email', email.toLowerCase())
        .neq('id', clientId)
        .single()

      if (duplicateClient) {
        return NextResponse.json(
          { error: 'Client with this email already exists' },
          { status: 409 },
        )
      }
    }

    // Update client
    const updateData = {
      name: name.trim(),
      email: email?.toLowerCase() || null,
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      position: position?.trim() || null,
      notes: notes?.trim() || null,
      tags: tags || [],
      status: status || 'active',
    }

    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .eq('coach_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json(
        { error: 'Failed to update client' },
        { status: 500 },
      )
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error in client PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
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

    // Check if client has associated sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('coaching_sessions')
      .select('id')
      .eq('client_id', clientId)
      .limit(1)

    if (sessionsError) {
      console.error('Error checking client sessions:', sessionsError)
      return NextResponse.json(
        { error: 'Failed to check client sessions' },
        { status: 500 },
      )
    }

    if (sessions && sessions.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete client with associated coaching sessions. Archive the client instead.',
        },
        { status: 400 },
      )
    }

    // Delete client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('coach_id', user.id)

    if (error) {
      console.error('Error deleting client:', error)
      return NextResponse.json(
        { error: 'Failed to delete client' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in client DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
