import { NextRequest, NextResponse } from 'next/server'
import { coachingAnalysisService } from '@/lib/coaching-analysis'
import { transcriptStore } from '@/lib/transcript-store'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    const { botId } = await params

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: 'OpenAI API key not configured',
          message:
            'OPENAI_API_KEY environment variable is required for coaching analysis',
        },
        { status: 500 },
      )
    }

    // Get the current session and transcript
    const session = transcriptStore.getSession(botId)
    if (!session) {
      return NextResponse.json(
        { error: 'Bot session not found' },
        { status: 404 },
      )
    }

    // Get the last analysis to determine what's already been analyzed
    const lastAnalysis = coachingAnalysisService.getLatestAnalysis(botId)
    const lastAnalyzedIndex = lastAnalysis?.lastAnalyzedTranscriptIndex || 0

    // Only analyze if there are new transcript entries
    if (session.transcript.length <= lastAnalyzedIndex) {
      return NextResponse.json({
        message: 'No new content to analyze',
        analysis: lastAnalysis,
      })
    }

    // Fetch user's coaching preference
    let userCoachingPreference: string | null = null
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
      
      if (user && authToken) {
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
        
        const { data: profile } = await authenticatedSupabase
          .from('profiles')
          .select('coaching_preference')
          .eq('id', user.id)
          .single()
        
        userCoachingPreference = profile?.coaching_preference || null
      }
    } catch (error) {
      console.warn('Failed to fetch user coaching preference:', error)
    }

    // Perform the coaching analysis with user preference
    const analysis = await coachingAnalysisService.analyzeConversation(
      botId,
      session.transcript,
      lastAnalyzedIndex,
      userCoachingPreference,
    )

    return NextResponse.json({
      success: true,
      analysis,
      newSuggestions: analysis.suggestions.length,
      transcriptLength: session.transcript.length,
      analyzedFromIndex: lastAnalyzedIndex,
    })
  } catch (error) {
    console.error('Error in coaching analysis:', error)

    return NextResponse.json(
      {
        error: 'Analysis failed',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    const { botId } = await params

    // Get the latest analysis for this bot
    const analysis = coachingAnalysisService.getLatestAnalysis(botId)

    if (!analysis) {
      return NextResponse.json(
        { error: 'No analysis found for this session' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      analysis,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching coaching analysis:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
