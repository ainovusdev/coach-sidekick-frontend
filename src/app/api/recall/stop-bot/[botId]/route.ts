import { NextRequest, NextResponse } from 'next/server'
import { getRecallHeaders, config, isConfigured } from '@/lib/config'
import { transcriptStore } from '@/lib/transcript-store'
import { coachingAnalysisService } from '@/lib/coaching-analysis'
import { batchSaveService } from '@/lib/batch-save-service'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    // Check if the app is properly configured
    if (!isConfigured()) {
      return NextResponse.json(
        {
          error: 'Application not configured',
          message:
            'RECALL_API_KEY is missing. Please check your environment variables.',
        },
        { status: 500 },
      )
    }

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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    const { botId } = await params

    // Get session data from transcript store before stopping the bot
    const session = transcriptStore.getSession(botId)
    const latestAnalysis = coachingAnalysisService.getLatestAnalysis(botId)

    // Stop the bot via Recall API
    const response = await fetch(
      `${config.recall.apiUrl}/bot/${botId}/leave_call`,
      {
        method: 'POST',
        headers: getRecallHeaders(),
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to stop bot: ${response.statusText}`)
    }

    const botData = await response.json()

    // Save any remaining unsaved transcript data and meeting summary
    let savedMeetingData = null
    if (session) {
      try {
        // First, save any unsaved transcripts using batch save
        const batchSaveResult = await batchSaveService.forceSaveSession(botId)
        console.log(
          `Final batch save for ${botId}: ${batchSaveResult.savedCount} entries`,
        )

        // Then save meeting summary and analysis
        savedMeetingData = await saveMeetingSummary(
          user.id,
          botId,
          session,
          latestAnalysis,
        )

        // Clean up in-memory data after successful save
        transcriptStore.cleanupSession(botId)
        coachingAnalysisService.clearAnalysis(botId)

        console.log(
          `Meeting completed for bot ${botId}: ${session.transcript.length} total transcript entries`,
        )
      } catch (saveError) {
        console.error('Error saving meeting data:', saveError)
        // Don't fail the stop operation if save fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bot stopped successfully',
      bot: botData,
      savedMeetingData: savedMeetingData
        ? {
            transcriptEntries: savedMeetingData.transcriptCount,
            analysisCount: savedMeetingData.analysisCount,
            sessionId: savedMeetingData.sessionId,
          }
        : null,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('RECALL_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Configuration error',
          message: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to stop bot',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

async function saveMeetingSummary(
  userId: string,
  botId: string,
  session: any,
  analysis: any,
) {
  // Find the coaching session in the database
  const { data: coachingSession, error: sessionError } = await supabase
    .from('coaching_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('bot_id', botId)
    .single()

  if (sessionError || !coachingSession) {
    throw new Error('Coaching session not found in database')
  }

  const sessionId = coachingSession.id

  // Get the current transcript count from database
  const { data: existingEntries } = await supabase
    .from('transcript_entries')
    .select('id')
    .eq('coaching_session_id', sessionId)

  const transcriptCount = existingEntries?.length || 0

  // Save coaching analysis if available
  let analysisCount = 0
  if (analysis) {
    const analysisData = {
      coaching_session_id: sessionId,
      analysis_id: analysis.analysisId,
      overall_score: analysis.overallScore,
      criteria_scores: analysis.criteriaScores,
      go_live_alignment: analysis.goLiveAlignment,
      suggestions: analysis.suggestions,
      conversation_phase: analysis.conversationPhase,
      phase_reasoning: analysis.phaseReasoning,
      coach_energy_level: analysis.coachEnergyLevel,
      coach_energy_reasoning: analysis.coachEnergyReasoning,
      client_engagement_level: analysis.clientEngagementLevel,
      client_engagement_reasoning: analysis.clientEngagementReasoning,
      patterns_detected: analysis.patternsDetected,
      urgent_moments: analysis.urgentMoments,
      meta_opportunities: analysis.metaOpportunities,
      last_analyzed_transcript_index: analysis.lastAnalyzedTranscriptIndex,
    }

    const { error: analysisError } = await supabase
      .from('coaching_analyses')
      .insert(analysisData)

    if (analysisError) {
      console.error('Error saving coaching analysis:', analysisError)
    } else {
      analysisCount = 1
    }
  }

  // Calculate meeting duration
  const durationMinutes = session.createdAt
    ? Math.round((Date.now() - session.createdAt.getTime()) / 60000)
    : null

  // Create meeting summary
  const summaryData = {
    coaching_session_id: sessionId,
    duration_minutes: durationMinutes,
    total_transcript_entries: transcriptCount,
    total_coaching_suggestions: analysis?.suggestions?.length || 0,
    final_overall_score: analysis?.overallScore || null,
    final_conversation_phase: analysis?.conversationPhase || null,
    key_insights: analysis?.metaOpportunities || [],
    action_items: [], // Could be extracted from suggestions in the future
    meeting_summary: `Meeting completed with ${transcriptCount} transcript entries and ${
      analysis?.suggestions?.length || 0
    } coaching suggestions.`,
  }

  const { error: summaryError } = await supabase
    .from('meeting_summaries')
    .insert(summaryData)

  if (summaryError) {
    console.error('Error saving meeting summary:', summaryError)
  }

  // Update coaching session status to completed
  const { error: updateError } = await supabase
    .from('coaching_sessions')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (updateError) {
    console.error('Error updating session status:', updateError)
  }

  return {
    sessionId,
    transcriptCount,
    analysisCount,
    durationMinutes,
  }
}
