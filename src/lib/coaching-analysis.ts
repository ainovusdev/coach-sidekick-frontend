import OpenAI from 'openai'
import { personalAIHistoryService } from '@/services/personal-ai-history'
import { personalAIClient } from '@/services/personal-ai-client'
import { transcriptStore } from './transcript-store'

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
  goLiveConnection?: string
  timestamp: string
  source: 'openai' | 'personal-ai' // Add source to track where suggestion came from
}

export interface PersonalAISuggestion {
  id: string
  suggestion: string
  confidence: number
  source: 'personal-ai'
  timestamp: string
}

export interface CoachingAnalysis {
  botId: string
  analysisId: string
  timestamp: string
  overallScore: number
  criteriaScores: Record<string, number>
  goLiveAlignment: Record<string, number>
  suggestions: CoachingSuggestion[]
  personalAISuggestions: PersonalAISuggestion[] // Add Personal AI suggestions
  conversationPhase:
    | 'opening'
    | 'exploration'
    | 'insight'
    | 'commitment'
    | 'closing'
  phaseReasoning?: string
  coachEnergyLevel: number
  coachEnergyReasoning?: string
  clientEngagementLevel: number
  clientEngagementReasoning?: string
  patternsDetected: string[]
  urgentMoments: string[]
  metaOpportunities: string[]
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

export const GO_LIVE_VALUES = {
  growth:
    'Growth: Nudging growth edge awareness and inviting transformation beyond high performance',
  ownership:
    'Ownership: Inviting radical responsibility and moving beyond blame or victimhood',
  love: "Love: Reflecting fierce advocacy for the client's vision and highest potential",
  integrity:
    "Integrity: Aligning with the client's stated commitments, values, and authentic self",
  vision:
    'Vision: Amplifying or reconnecting to a compelling, transformative future',
  energy:
    'Energy: Raising stakes, emotion, aliveness, and sense of possibility',
}

export const PROMPT_CATEGORIES = {
  clarify_reflect:
    'Help the coach reflect or clarify statements that may have hidden power',
  expand_vision:
    'Push the client to think bigger, longer-term, or legacy-oriented',
  increase_ownership:
    'Challenge the client to take fuller responsibility or shift from blame',
  reveal_cost_payoff:
    'Help the client weigh hidden consequences or benefits of action/inaction',
  interrupt_loop: 'Disrupt patterns of circular logic, story, or victimhood',
  probe_commitment:
    'Test how real the client is about their intentions or change',
  double_click_emotion: 'Slow down for emotional processing or buried insights',
  connect_go_live: 'Tie their current state to GO LIVE values explicitly',
  spot_meta_moment:
    'Highlight moments where the client is revealing patterns or breakthrough opportunities',
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

      // Get historical context from Personal AI if client is linked
      const clientId = transcriptStore.getClientId(botId)
      let historicalContext: string | null = null

      if (clientId) {
        try {
          historicalContext = await personalAIHistoryService.getRelevantContext(
            clientId,
          )
        } catch (error) {
          console.warn(
            `Failed to get historical context for client ${clientId}:`,
            error,
          )
        }
      }

      const prompt = this.buildAnalysisPrompt(
        fullConversation,
        recentConversation,
        previousAnalysis,
        historicalContext,
      )

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              "You are an expert Coach Sidekick designed to augment a coach's intuition, presence, and performance by analyzing real-time coaching conversations. You provide timely, context-aware suggestions filtered through GO LIVE values and meta performance principles to deepen impact, provoke vision, expand ownership, and unlock stuck moments. You are the brush, not the painter - always offering options to empower the coach's artistry.",
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

      // Get Personal AI suggestions in parallel using the same data as OpenAI
      try {
        const personalAISuggestions = await this.getPersonalAISuggestions(
          botId,
          transcript,
          newEntries,
        )
        analysis.personalAISuggestions = personalAISuggestions
      } catch (error) {
        console.warn(
          `Failed to get Personal AI suggestions for ${botId}:`,
          error,
        )
        analysis.personalAISuggestions = []
      }

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
    historicalContext?: string | null,
  ): string {
    const criteriaList = Object.entries(COACHING_CRITERIA)
      .map(([key, description]) => `- ${key}: ${description}`)
      .join('\n')

    const goLiveValuesList = Object.entries(GO_LIVE_VALUES)
      .map(([key, description]) => `- ${key}: ${description}`)
      .join('\n')

    const promptCategoriesList = Object.entries(PROMPT_CATEGORIES)
      .map(([key, description]) => `- ${key}: ${description}`)
      .join('\n')

    return `
🧠 COACH SIDEKICK: REAL-TIME TRANSCRIPT ANALYSIS & SUPPORT

PURPOSE: You are a real-time assistant designed to augment a coach's intuition, presence, and performance by analyzing coaching conversations as they unfold and offering timely, context-aware suggestions to deepen impact, provoke vision, expand ownership, and unlock stuck moments.

🧭 FOUNDATIONAL FILTERS
All analysis and suggestions must be filtered through these principles:

META PERFORMANCE LENS:
→ Is this inviting the client beyond high performance into transformation, legacy, or exponential impact?

GO LIVE VALUES CHECK:
${goLiveValuesList}

COACH IS THE ARTIST:
→ You are the brush, not the painter. Always offer options, never commands. The coach decides when and how to use your input.

📊 COACHING CRITERIA TO EVALUATE:
${criteriaList}

🛠️ PROMPT CATEGORIES FOR SUGGESTIONS:
${promptCategoriesList}

📡 CONVERSATION CONTEXT:

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
- Coach Energy: ${previousAnalysis.coachEnergyLevel}/10
- Client Engagement: ${previousAnalysis.clientEngagementLevel}/10
- Previous Suggestions Count: ${previousAnalysis.suggestions.length}
`
    : ''
}

${
  historicalContext
    ? `
📚 CLIENT HISTORICAL CONTEXT:
This client has previous coaching sessions. Use this information to provide more personalized and contextual suggestions:

${historicalContext}

HISTORICAL CONTEXT INTEGRATION:
- Reference previous patterns when they appear in current conversation
- Build on previous insights and breakthroughs
- Address recurring challenges with deeper or evolved approaches
- Recognize progress made since previous sessions
- Suggest continuity-based coaching strategies
- Use past strengths to unlock current stuck moments
`
    : '🆕 NEW CLIENT: This appears to be a new client without previous session history. Focus on building rapport, understanding their context, and establishing coaching foundations.'
}

🎯 REAL-TIME SENSING LOGIC:

PATTERN RECOGNITION: Look for loops, emotional shifts, contradictions, stuckness, subtle reveals, hesitations, or repeated phrases.

TIMING AWARENESS:
- Early in call: prioritize connection, context-building, and curiosity prompts
- Mid-call: deepen ownership, expand vision, challenge beliefs  
- End of call: commitment, action steps, reflections on process

URGENT MOMENTS: Flag with high priority if you detect:
- Client repeating phrases indicating stuckness
- Emotional breakthrough opportunities
- Resistance or avoidance patterns
- Moments where future self could emerge

📋 ANALYSIS REQUIREMENTS:

1. REAL-TIME SUGGESTIONS (1-4 max): Generate specific, actionable prompts the coach can use RIGHT NOW. Each suggestion should:
   - Be immediately usable
   - Target a specific opportunity or stuck moment
   - Connect to GO LIVE values where relevant
   - Include timing guidance (now/next_pause/end_of_call)
   - Have clear category and rationale

2. SCORING: Rate each coaching criteria 1-10 based on full conversation, with GO LIVE values lens

3. CONVERSATION PHASE: Identify current phase with reasoning

4. ENERGY ASSESSMENT: Rate coach energy and client engagement with brief rationale

5. PATTERN DETECTION: Note any loops, breakthroughs, or meta moments observed

RESPONSE FORMAT (JSON):
{
  "overallScore": 7,
  "criteriaScores": {
    "clear_vision": 6,
    "max_value": 7,
    "client_participation": 8,
    "expand_possibilities": 5,
    "commitments_awareness": 7,
    "powerful_questions": 8,
    "listening_levels": 6,
    "client_ownership": 5,
    "be_do_have": 4,
    "disrupt_beliefs": 6,
    "insights_to_actions": 7,
    "energy_dance": 8
  },
  "goLiveAlignment": {
    "growth": 7,
    "ownership": 5,
    "love": 8,
    "integrity": 7,
    "vision": 6,
    "energy": 8
  },
  "suggestions": [
    {
      "type": "immediate",
      "priority": "high",
      "category": "interrupt_loop",
      "suggestion": "What's the question you don't want me to ask you right now?",
      "rationale": "Client has repeated 'I don't know what to do' three times, indicating a stuck loop",
      "timing": "now",
      "triggeredBy": "Repeated phrase indicating stuckness",
      "goLiveConnection": "ownership"
    },
    {
      "type": "immediate", 
      "priority": "medium",
      "category": "expand_vision",
      "suggestion": "If this went 10x better than expected, what would it look like?",
      "rationale": "Client is thinking tactically but hasn't connected to bigger vision",
      "timing": "next_pause",
      "goLiveConnection": "vision"
    }
  ],
  "conversationPhase": "exploration",
  "phaseReasoning": "Client is sharing context and challenges but hasn't moved into insight or commitment",
  "coachEnergyLevel": 7,
  "coachEnergyReasoning": "Present and asking good questions but could push deeper",
  "clientEngagementLevel": 6,
  "clientEngagementReasoning": "Sharing openly but showing some resistance to ownership",
  "patternsDetected": [
    "Client deflecting responsibility with 'they' language",
    "Repeated use of 'stuck' without exploring what that means"
  ],
  "urgentMoments": [],
  "metaOpportunities": [
    "Client just revealed a core belief about their limitations - opportunity for breakthrough"
  ]
}

🚫 WHEN NOT TO SUGGEST:
- Don't interrupt every line - only suggest when there's meaningful opportunity
- If coach is clearly in flow, pause suggestions
- For deeply emotional moments, offer spacious/somatic prompts, not cerebral ones
- If recent conversation lacks substance, focus on scoring existing conversation

Focus on being the coach's intuitive sidekick - amplifying their natural instincts with timely, powerful options that serve the client's transformation.
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
          id: `openai-${botId}-${Date.now()}-${index}`,
          type: s.type || 'immediate',
          priority: s.priority || 'medium',
          category: s.category || 'general',
          suggestion: s.suggestion,
          rationale: s.rationale || '',
          timing: s.timing || 'now',
          triggeredBy: s.triggeredBy,
          goLiveConnection: s.goLiveConnection,
          timestamp: new Date().toISOString(),
          source: 'openai' as const,
        }),
      )

      return {
        botId,
        analysisId: `analysis-${botId}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        overallScore: parsed.overallScore || 5,
        criteriaScores: parsed.criteriaScores || {},
        goLiveAlignment: parsed.goLiveAlignment || {},
        suggestions,
        personalAISuggestions: [], // Will be populated later
        conversationPhase: parsed.conversationPhase || 'exploration',
        phaseReasoning: parsed.phaseReasoning,
        coachEnergyLevel: parsed.coachEnergyLevel || 5,
        coachEnergyReasoning: parsed.coachEnergyReasoning,
        clientEngagementLevel: parsed.clientEngagementLevel || 5,
        clientEngagementReasoning: parsed.clientEngagementReasoning,
        patternsDetected: parsed.patternsDetected || [],
        urgentMoments: parsed.urgentMoments || [],
        metaOpportunities: parsed.metaOpportunities || [],
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

  // Get client progress summary for analysis enhancement
  async getClientProgressSummary(botId: string): Promise<string | null> {
    const clientId = transcriptStore.getClientId(botId)
    if (!clientId) return null

    try {
      return await personalAIHistoryService.getClientProgressSummary(clientId)
    } catch (error) {
      console.warn(
        `Failed to get client progress summary for ${clientId}:`,
        error,
      )
      return null
    }
  }

  // Get Personal AI suggestions using the same transcript data as OpenAI
  async getPersonalAISuggestions(
    botId: string,
    transcript: TranscriptEntry[],
    newEntries: TranscriptEntry[],
  ): Promise<PersonalAISuggestion[]> {
    try {
      // Check if Personal AI is configured
      if (
        !process.env.PERSONAL_AI_API_KEY ||
        !process.env.PERSONAL_AI_DOMAIN_NAME
      ) {
        return []
      }

      const clientId = transcriptStore.getClientId(botId)
      const personalAISessionId = transcriptStore.getPersonalAISessionId(botId)

      // Use the same conversation data that OpenAI analyzes
      const fullConversation = transcript
        .filter(entry => entry.is_final)
        .map(entry => `${entry.speaker}: ${entry.text}`)
        .join('\n')

      const recentConversation = newEntries
        .filter(entry => entry.is_final)
        .map(entry => `${entry.speaker}: ${entry.text}`)
        .join('\n')

      // Prefer recent conversation, but use full if recent is empty
      const conversationToAnalyze =
        recentConversation.trim() || fullConversation

      if (!conversationToAnalyze.trim()) {
        return []
      }

      // Enhanced prompt that matches OpenAI's coaching analysis depth
      const promptText = `You are an expert coaching assistant analyzing a live coaching conversation. Based on this conversation, provide 2-3 specific, actionable suggestions for the coach.

CONVERSATION CONTEXT:
${conversationToAnalyze}

Please provide coaching suggestions that:
1. Are immediately actionable for the coach
2. Help deepen the client's insights or commitment
3. Move the conversation toward transformation
4. Are based on what you observe in the client's language and energy

Format each suggestion clearly and make them practical for real-time use.`

      const response = await personalAIClient.sendMessage({
        Text: promptText,
        DomainName: process.env.PERSONAL_AI_DOMAIN_NAME!,
        SessionId: personalAISessionId || undefined,
        SourceName: 'Coach Sidekick',
        UserName: clientId ? `Client-${clientId}` : 'Unknown Client',
        Context: 'Real-time coaching analysis',
      })

      // Parse Personal AI response into suggestions
      const suggestions: PersonalAISuggestion[] = []
      const aiMessage = response.ai_message

      if (aiMessage && aiMessage.trim().length > 10) {
        // More sophisticated parsing to extract actual suggestions
        const lines = aiMessage
          .split(/\n+/)
          .filter(line => line.trim().length > 0)
        let suggestionCount = 0

        for (const line of lines) {
          const trimmedLine = line.trim()

          // Look for suggestion patterns (numbered, bulleted, or clear suggestion language)
          if (
            (trimmedLine.match(/^\d+\./) ||
              trimmedLine.match(/^[-•*]/) ||
              trimmedLine.toLowerCase().includes('suggest') ||
              trimmedLine.toLowerCase().includes('try') ||
              trimmedLine.toLowerCase().includes('ask') ||
              trimmedLine.toLowerCase().includes('explore')) &&
            trimmedLine.length > 20 &&
            suggestionCount < 3
          ) {
            // Clean up the suggestion text
            const suggestion = trimmedLine
              .replace(/^\d+\.\s*/, '')
              .replace(/^[-•*]\s*/, '')
              .trim()

            if (suggestion.length > 15) {
              suggestions.push({
                id: `personal-ai-${botId}-${Date.now()}-${suggestionCount}`,
                suggestion,
                confidence: Math.min(response.ai_score / 100 || 0.8, 1.0),
                source: 'personal-ai',
                timestamp: new Date().toISOString(),
              })
              suggestionCount++
            }
          }
        }

        // If no structured suggestions found, create one from the main response
        if (suggestions.length === 0 && aiMessage.length > 50) {
          suggestions.push({
            id: `personal-ai-${botId}-${Date.now()}-0`,
            suggestion: aiMessage.trim(),
            confidence: Math.min(response.ai_score / 100 || 0.8, 1.0),
            source: 'personal-ai',
            timestamp: new Date().toISOString(),
          })
        }
      }

      console.log(
        `[Personal AI] Generated ${suggestions.length} suggestions for bot ${botId}`,
      )
      return suggestions
    } catch (error) {
      console.error(
        `[Personal AI] Failed to get suggestions for bot ${botId}:`,
        error,
      )
      return []
    }
  }

  // Enhanced analysis method with client context
  async analyzeConversationWithClientContext(
    botId: string,
    transcript: TranscriptEntry[],
    lastAnalyzedIndex: number = 0,
  ): Promise<CoachingAnalysis> {
    // This is an alias for the main analysis method which now includes historical context
    return this.analyzeConversation(botId, transcript, lastAnalyzedIndex)
  }
}

export const coachingAnalysisService = new CoachingAnalysisService()
