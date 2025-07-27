import { NextRequest, NextResponse } from 'next/server'
import { personalAIClient } from '@/services/personal-ai-client'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const authToken = authHeader.substring(7)

    // Create authenticated Supabase client
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

    // Verify the user
    const {
      data: { user },
      error: authError,
    } = await authenticatedSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check configuration
    const configured = !!(process.env.PERSONAL_AI_API_KEY && process.env.PERSONAL_AI_DOMAIN_NAME)
    
    if (!configured) {
      return NextResponse.json({
        configured: false,
        healthy: false,
        message: 'Personal AI not configured - missing API key or domain name',
      })
    }

    // Test Personal AI connection
    const startTime = Date.now()
    const healthy = await personalAIClient.healthCheck()
    const responseTime = Date.now() - startTime

    return NextResponse.json({
      configured: true,
      healthy,
      responseTime,
      domain: process.env.PERSONAL_AI_DOMAIN_NAME,
      timestamp: new Date().toISOString(),
      message: healthy 
        ? 'Personal AI connection successful' 
        : 'Personal AI connection failed',
    })
  } catch (error) {
    console.error('[Personal AI Health] Error:', error)
    
    return NextResponse.json({
      configured: !!(process.env.PERSONAL_AI_API_KEY && process.env.PERSONAL_AI_DOMAIN_NAME),
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
}