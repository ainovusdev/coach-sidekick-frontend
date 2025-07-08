import { NextRequest, NextResponse } from 'next/server'
import { coachingAnalysisService } from '@/lib/coaching-analysis'
import { transcriptStore } from '@/lib/transcript-store'

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

    // Perform the coaching analysis
    const analysis = await coachingAnalysisService.analyzeConversation(
      botId,
      session.transcript,
      lastAnalyzedIndex,
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
