import { personalAIClient } from './personal-ai-client';
import {
  CoachingSessionMemory,
  PersonalAIMemoryRequest,
  PersonalAIUploadTextRequest,
} from '@/types/personal-ai';
import { TranscriptEntry, CoachingSession, Client } from '@/types/meeting';
import { CoachingAnalysis } from '@/lib/coaching-analysis';

export class PersonalAIMemoryService {
  private readonly client = personalAIClient;
  private uploadedSessions = new Set<string>();

  async uploadCoachingSession(
    session: CoachingSession,
    transcriptEntries: TranscriptEntry[],
    coachingAnalysis?: CoachingAnalysis,
    client?: Client
  ): Promise<boolean> {
    try {
      if (this.uploadedSessions.has(session.id)) {
        console.log(`Session ${session.id} already uploaded to Personal AI`);
        return true;
      }

      const sessionMemory = this.formatSessionForMemory(
        session,
        transcriptEntries,
        coachingAnalysis,
        client
      );

      const memoryText = this.createMemoryText(sessionMemory);
      
      const uploadRequest: PersonalAIUploadTextRequest = {
        Text: memoryText,
        DomainName: process.env.PERSONAL_AI_DOMAIN_NAME!,
        Title: `Coaching Session - ${sessionMemory.clientName || 'Unknown Client'} - ${sessionMemory.sessionDate}`,
        SourceName: 'Coach Sidekick',
        TimeStamp: sessionMemory.sessionDate,
        UserName: sessionMemory.coachName,
      };

      const result = await this.client.uploadText(uploadRequest);
      
      if (result.success) {
        this.uploadedSessions.add(session.id);
        console.log(`Successfully uploaded session ${session.id} to Personal AI`);
        return true;
      } else {
        console.error(`Failed to upload session ${session.id}:`, result.message);
        return false;
      }
    } catch (error) {
      console.error(`Error uploading session ${session.id} to Personal AI:`, error);
      return false;
    }
  }

  async uploadSessionUpdate(
    sessionId: string,
    additionalTranscript: TranscriptEntry[],
    updatedAnalysis?: CoachingAnalysis
  ): Promise<boolean> {
    try {
      const updateText = this.createUpdateText(sessionId, additionalTranscript, updatedAnalysis);
      
      const memoryRequest: PersonalAIMemoryRequest = {
        Text: updateText,
        DomainName: process.env.PERSONAL_AI_DOMAIN_NAME!,
        Title: `Session Update - ${sessionId}`,
        SourceName: 'Coach Sidekick',
        TimeStamp: new Date().toISOString(),
      };

      const result = await this.client.uploadMemory(memoryRequest);
      return result.success;
    } catch (error) {
      console.error(`Error uploading session update for ${sessionId}:`, error);
      return false;
    }
  }

  private formatSessionForMemory(
    session: CoachingSession,
    transcriptEntries: TranscriptEntry[],
    coachingAnalysis?: CoachingAnalysis,
    client?: Client
  ): CoachingSessionMemory {
    const finalTranscript = transcriptEntries
      .filter(entry => entry.is_final)
      .map(entry => `${entry.speaker}: ${entry.text}`)
      .join('\n');

    const keyInsights = this.extractKeyInsights(transcriptEntries, coachingAnalysis);

    return {
      sessionId: session.id,
      clientName: client?.name,
      coachName: 'Coach', // You may want to get actual coach name from user context
      sessionDate: session.created_at,
      sessionType: 'coaching', // Default, could be enhanced based on session metadata
      keyInsights,
      transcript: finalTranscript,
      coachingAnalysis: coachingAnalysis ? {
        overallScore: coachingAnalysis.overallScore,
        criteriaScores: coachingAnalysis.criteriaScores,
        suggestions: coachingAnalysis.suggestions.map(s => ({
          content: s.suggestion,
          priority: s.priority,
          category: s.category,
        })),
      } : undefined,
    };
  }

  private createMemoryText(sessionMemory: CoachingSessionMemory): string {
    const parts = [];

    parts.push(`COACHING SESSION SUMMARY`);
    parts.push(`Date: ${new Date(sessionMemory.sessionDate).toLocaleDateString()}`);
    parts.push(`Client: ${sessionMemory.clientName || 'Unknown'}`);
    parts.push(`Coach: ${sessionMemory.coachName}`);
    parts.push(`Session Type: ${sessionMemory.sessionType}`);
    parts.push('');

    if (sessionMemory.keyInsights.length > 0) {
      parts.push('KEY INSIGHTS:');
      sessionMemory.keyInsights.forEach(insight => {
        parts.push(`- ${insight}`);
      });
      parts.push('');
    }

    if (sessionMemory.coachingAnalysis) {
      parts.push('COACHING ANALYSIS:');
      parts.push(`Overall Score: ${sessionMemory.coachingAnalysis.overallScore}/10`);
      
      if (sessionMemory.coachingAnalysis.suggestions.length > 0) {
        parts.push('Key Coaching Areas:');
        sessionMemory.coachingAnalysis.suggestions
          .filter(s => s.priority === 'high')
          .slice(0, 3)
          .forEach(suggestion => {
            parts.push(`- ${suggestion.category}: ${suggestion.content}`);
          });
      }
      parts.push('');
    }

    parts.push('CONVERSATION TRANSCRIPT:');
    parts.push(sessionMemory.transcript);

    return parts.join('\n');
  }

  private createUpdateText(
    sessionId: string,
    additionalTranscript: TranscriptEntry[],
    updatedAnalysis?: CoachingAnalysis
  ): string {
    const parts = [];
    
    parts.push(`SESSION UPDATE - ${sessionId}`);
    parts.push(`Update Time: ${new Date().toISOString()}`);
    parts.push('');

    if (additionalTranscript.length > 0) {
      parts.push('ADDITIONAL CONVERSATION:');
      additionalTranscript
        .filter(entry => entry.is_final)
        .forEach(entry => {
          parts.push(`${entry.speaker}: ${entry.text}`);
        });
      parts.push('');
    }

    if (updatedAnalysis) {
      parts.push('UPDATED ANALYSIS:');
      parts.push(`Overall Score: ${updatedAnalysis.overallScore}/10`);
      parts.push(`Conversation Phase: ${updatedAnalysis.conversationPhase}`);
      
      if (updatedAnalysis.suggestions.length > 0) {
        parts.push('Latest Suggestions:');
        updatedAnalysis.suggestions
          .slice(-3)
          .forEach(suggestion => {
            parts.push(`- ${suggestion.category}: ${suggestion.suggestion}`);
          });
      }
    }

    return parts.join('\n');
  }

  private extractKeyInsights(
    transcriptEntries: TranscriptEntry[],
    coachingAnalysis?: CoachingAnalysis
  ): string[] {
    const insights: string[] = [];

    if (coachingAnalysis) {
      if (coachingAnalysis.patternsDetected.length > 0) {
        insights.push(...coachingAnalysis.patternsDetected.slice(0, 3));
      }

      if (coachingAnalysis.metaOpportunities.length > 0) {
        insights.push(...coachingAnalysis.metaOpportunities.slice(0, 2));
      }

      const highValueSuggestions = coachingAnalysis.suggestions
        .filter(s => s.priority === 'high')
        .slice(0, 2)
        .map(s => `${s.category}: ${s.rationale}`);
      
      insights.push(...highValueSuggestions);
    }

    const transcriptInsights = this.extractTranscriptInsights(transcriptEntries);
    insights.push(...transcriptInsights);

    return insights.slice(0, 5);
  }

  private extractTranscriptInsights(transcriptEntries: TranscriptEntry[]): string[] {
    const insights: string[] = [];
    const clientMessages = transcriptEntries
      .filter(entry => entry.is_final && !this.isCoachSpeaking(entry.speaker))
      .map(entry => entry.text);

    if (clientMessages.length > 10) {
      insights.push('Client was highly engaged with extensive participation');
    }

    const emotionalWords = ['excited', 'frustrated', 'confused', 'confident', 'worried', 'hopeful'];
    const emotions = clientMessages
      .join(' ')
      .toLowerCase()
      .split(' ')
      .filter(word => emotionalWords.includes(word));

    if (emotions.length > 0) {
      insights.push(`Client expressed emotions: ${[...new Set(emotions)].join(', ')}`);
    }

    return insights;
  }

  private isCoachSpeaking(speaker: string): boolean {
    const coachIndicators = ['coach', 'facilitator', 'trainer', 'mentor'];
    return coachIndicators.some(indicator => 
      speaker.toLowerCase().includes(indicator)
    );
  }

  isSessionUploaded(sessionId: string): boolean {
    return this.uploadedSessions.has(sessionId);
  }

  markSessionAsUploaded(sessionId: string): void {
    this.uploadedSessions.add(sessionId);
  }

  async testConnection(): Promise<boolean> {
    return await this.client.healthCheck();
  }
}

export const personalAIMemoryService = new PersonalAIMemoryService();