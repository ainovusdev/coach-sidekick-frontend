import { NextRequest, NextResponse } from 'next/server'
import { coachingAnalysisService } from '@/lib/coaching-analysis'
import { transcriptStore } from '@/lib/transcript-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { botId: string } },
) {
  try {
    const { botId } = params
    const { searchParams } = new URL(request.url)
    const autoAnalyze = searchParams.get('auto_analyze') === 'true'
    const onlyActive = searchParams.get('only_active') === 'true'

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

    // Get the current session
    const session = transcriptStore.getSession(botId)
    if (!session) {
      return NextResponse.json(
        {
          error: 'Bot session not found',
        },
        { status: 404 },
      )
    }

    let analysis = coachingAnalysisService.getLatestAnalysis(botId)

    // Auto-analyze if requested and there's new content
    if (autoAnalyze) {
      const lastAnalyzedIndex = analysis?.lastAnalyzedTranscriptIndex || 0

      // Only analyze if there are new transcript entries (at least 3 new entries to avoid too frequent analysis)
      if (session.transcript.length > lastAnalyzedIndex + 2) {
        try {
          analysis = await coachingAnalysisService.analyzeConversation(
            botId,
            session.transcript,
            lastAnalyzedIndex,
          )
        } catch (analyzeError) {
          console.error('Auto-analysis failed:', analyzeError)
          // Continue with existing analysis if auto-analysis fails
        }
      }
    }

    if (!analysis) {
      return NextResponse.json({
        suggestions: [],
        message: 'No analysis available yet. Try triggering analysis manually.',
        hasTranscript: session.transcript.length > 0,
        transcriptLength: session.transcript.length,
      })
    }

    // Filter suggestions if only_active is requested
    let suggestions = analysis.suggestions
    if (onlyActive) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      suggestions = suggestions.filter(
        s =>
          new Date(s.timestamp) > fiveMinutesAgo &&
          (s.timing === 'now' || s.timing === 'next_pause'),
      )
    }

    return NextResponse.json({
      suggestions,
      analysis: {
        overallScore: analysis.overallScore,
        conversationPhase: analysis.conversationPhase,
        coachEnergyLevel: analysis.coachEnergyLevel,
        clientEngagementLevel: analysis.clientEngagementLevel,
        timestamp: analysis.timestamp,
        personalAISuggestions: analysis.personalAISuggestions || [], // Include Personal AI suggestions
      },
      metadata: {
        totalSuggestions: analysis.suggestions.length,
        activeSuggestions: suggestions.length,
        personalAISuggestionsCount: analysis.personalAISuggestions?.length || 0,
        transcriptLength: session.transcript.length,
        lastAnalyzedIndex: analysis.lastAnalyzedTranscriptIndex,
        sessionAge: Math.round(
          (Date.now() - session.createdAt.getTime()) / 60000,
        ), // minutes
      },
    })
  } catch (error) {
    console.error('Error fetching coaching suggestions:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch suggestions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
