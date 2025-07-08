import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface CoachingSuggestion {
  id: string
  type: 'immediate' | 'reflection' | 'improvement'
  priority: 'high' | 'medium' | 'low'
  category: string
  suggestion: string
  rationale: string
  timing: 'now' | 'next_pause' | 'end_of_call'
  triggeredBy?: string
  timestamp: string
}

export interface CoachingAnalysis {
  botId: string
  analysisId: string
  timestamp: string
  overallScore: number
  criteriaScores: Record<string, number>
  suggestions: CoachingSuggestion[]
  conversationPhase:
    | 'opening'
    | 'exploration'
    | 'insight'
    | 'commitment'
    | 'closing'
  coachEnergyLevel: number
  clientEngagementLevel: number
  lastAnalyzedTranscriptIndex: number
}

export const COACHING_CRITERIA = {
  clear_vision:
    'The coach invites the client towards a clear, thrilling, measurable, and potentially transformative vision.',
  max_value:
    'Coaches in a way that max value for the call is clear and the client reports MV being created towards the end of call.',
  client_participation:
    'Client participation occurs as full, exploring who they are becoming.',
  expand_possibilities:
    'The coach expands what the client believes is possible.',
  commitments_awareness:
    'There is awareness and clarity of commitments, and growth process around broken commitments (if applicable).',
  powerful_questions:
    "The coach's key tools are powerful questions and silence.",
  listening_levels:
    'The coach demonstrates all three levels of listening, including what the client is saying, noticing facial expressions, body language, and tests their intuition when they have notices.',
  client_ownership:
    'The coach invites the client into ownership, and does not enroll in consulting or solving for the client.',
  be_do_have:
    'The coach invites the client to reinvent through the framework of Be Do Have.',
  disrupt_beliefs:
    "Coach disrupts the client's limiting beliefs, systems, or rackets by going through a mindset tool and creating new actions from insights.",
  insights_to_actions:
    'The client discovers insights that lead to actions and commitments.',
  energy_dance:
    'The coach "dances" with energy throughout the call in direct response to what is being noticed in the client.',
}

interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
  confidence: number
  is_final: boolean
  start_time?: number
  end_time?: number
}

class CoachingAnalysisService {
  private analyses: Map<string, CoachingAnalysis> = new Map()

  async analyzeConversation(
    botId: string,
    transcript: TranscriptEntry[],
    lastAnalyzedIndex: number = 0,
  ): Promise<CoachingAnalysis> {
    try {
      // Get only new transcript entries since last analysis
      const newEntries = transcript.slice(lastAnalyzedIndex)
      const fullConversation = transcript
        .map(entry => `${entry.speaker}: ${entry.text}`)
        .join('\n')

      const recentConversation = newEntries
        .map(entry => `${entry.speaker}: ${entry.text}`)
        .join('\n')

      // Get previous analysis if exists
      const previousAnalysis = this.analyses.get(botId)

      const prompt = this.buildAnalysisPrompt(
        fullConversation,
        recentConversation,
        previousAnalysis,
      )

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert coaching supervisor analyzing real-time coaching conversations to provide immediate, actionable feedback to coaches.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const analysisContent = response.choices[0].message.content
      if (!analysisContent) {
        throw new Error('No analysis content received from OpenAI')
      }

      const analysis = this.parseAnalysisResponse(
        botId,
        analysisContent,
        transcript.length,
      )

      // Store the analysis
      this.analyses.set(botId, analysis)

      return analysis
    } catch (error) {
      console.error('Error analyzing conversation:', error)
      throw error
    }
  }

  private buildAnalysisPrompt(
    fullConversation: string,
    recentConversation: string,
    previousAnalysis?: CoachingAnalysis,
  ): string {
    const criteriaList = Object.entries(COACHING_CRITERIA)
      .map(([key, description]) => `- ${key}: ${description}`)
      .join('\n')

    return `
COACHING CONVERSATION ANALYSIS

You are analyzing a live coaching conversation to provide real-time feedback to the coach. 

COACHING CRITERIA TO EVALUATE:
${criteriaList}

FULL CONVERSATION SO FAR:
${fullConversation}

RECENT NEW CONVERSATION SINCE LAST ANALYSIS:
${recentConversation}

${
  previousAnalysis
    ? `
PREVIOUS ANALYSIS CONTEXT:
- Overall Score: ${previousAnalysis.overallScore}/10
- Conversation Phase: ${previousAnalysis.conversationPhase}
- Previous Suggestions Count: ${previousAnalysis.suggestions.length}
`
    : ''
}

ANALYSIS REQUIREMENTS:

1. REAL-TIME SUGGESTIONS: Generate 1-3 immediate, actionable suggestions the coach can use RIGHT NOW or very soon. Focus on:
   - Missed opportunities in the recent conversation
   - Next best questions to ask
   - Energy/listening improvements needed immediately
   - Specific coaching techniques to apply

2. SCORING: Rate each criteria 1-10 based on the full conversation so far.

3. CONVERSATION PHASE: Identify current phase (opening/exploration/insight/commitment/closing)

4. ENERGY ASSESSMENT: Rate coach energy level (1-10) and client engagement (1-10)

RESPONSE FORMAT (JSON):
{
  "overallScore": 7,
  "criteriaScores": {
    "clear_vision": 6,
    "max_value": 7,
    ...
  },
  "suggestions": [
    {
      "type": "immediate",
      "priority": "high",
      "category": "powerful_questions",
      "suggestion": "Ask a more powerful question that goes deeper into their vision",
      "rationale": "Client mentioned goals but you haven't explored the emotional connection to their vision",
      "timing": "now"
    }
  ],
  "conversationPhase": "exploration",
  "coachEnergyLevel": 7,
  "clientEngagementLevel": 8
}

Focus on actionable, specific suggestions that will immediately improve the coaching conversation quality.
`
  }

  private parseAnalysisResponse(
    botId: string,
    content: string,
    lastAnalyzedIndex: number,
  ): CoachingAnalysis {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Generate suggestions with IDs and timestamps
      const suggestions: CoachingSuggestion[] = (parsed.suggestions || []).map(
        (s: any, index: number) => ({
          id: `${botId}-${Date.now()}-${index}`,
          type: s.type || 'immediate',
          priority: s.priority || 'medium',
          category: s.category || 'general',
          suggestion: s.suggestion,
          rationale: s.rationale || '',
          timing: s.timing || 'now',
          timestamp: new Date().toISOString(),
        }),
      )

      return {
        botId,
        analysisId: `analysis-${botId}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        overallScore: parsed.overallScore || 5,
        criteriaScores: parsed.criteriaScores || {},
        suggestions,
        conversationPhase: parsed.conversationPhase || 'exploration',
        coachEnergyLevel: parsed.coachEnergyLevel || 5,
        clientEngagementLevel: parsed.clientEngagementLevel || 5,
        lastAnalyzedTranscriptIndex: lastAnalyzedIndex,
      }
    } catch (error) {
      console.error('Error parsing analysis response:', error)
      throw new Error('Failed to parse coaching analysis')
    }
  }

  getLatestAnalysis(botId: string): CoachingAnalysis | null {
    return this.analyses.get(botId) || null
  }

  getAllAnalyses(): Record<string, CoachingAnalysis> {
    const result: Record<string, CoachingAnalysis> = {}
    for (const [botId, analysis] of this.analyses.entries()) {
      result[botId] = analysis
    }
    return result
  }

  clearAnalysis(botId: string): void {
    this.analyses.delete(botId)
  }

  // Clean up old analyses
  cleanup(maxAgeHours: number = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)

    for (const [botId, analysis] of this.analyses.entries()) {
      if (new Date(analysis.timestamp) < cutoff) {
        this.analyses.delete(botId)
      }
    }
  }
}

export const coachingAnalysisService = new CoachingAnalysisService()
