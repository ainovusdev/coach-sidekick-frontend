import { personalAIClient } from './personal-ai-client';
import { ClientHistoryContext } from '@/types/personal-ai';

export class PersonalAIHistoryService {
  private readonly client = personalAIClient;
  private historyCache = new Map<string, ClientHistoryContext>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getClientHistory(
    clientId: string
  ): Promise<ClientHistoryContext | null> {
    try {
      const cacheKey = `client-${clientId}`;
      
      if (this.isCacheValid(cacheKey)) {
        return this.historyCache.get(cacheKey) || null;
      }

      const sessionId = this.client.generateClientSessionId(clientId, 'history');
      const conversationHistory = await this.client.getConversationHistory(sessionId);

      if (conversationHistory.length === 0) {
        console.log(`No conversation history found for client ${clientId}`);
        return null;
      }

      const clientHistory = await this.processConversationHistory(
        clientId,
        conversationHistory
      );

      this.cacheHistory(cacheKey, clientHistory);
      return clientHistory;
    } catch (error) {
      console.error(`Error retrieving client history for ${clientId}:`, error);
      return null;
    }
  }

  async getClientProgressSummary(clientId: string): Promise<string | null> {
    try {
      const history = await this.getClientHistory(clientId);
      if (!history || history.previousSessions.length === 0) {
        return null;
      }

      return this.generateProgressSummary(history);
    } catch (error) {
      console.error(`Error generating progress summary for client ${clientId}:`, error);
      return null;
    }
  }

  async getRelevantContext(
    clientId: string
  ): Promise<string | null> {
    try {
      const history = await this.getClientHistory(clientId);
      if (!history) {
        return null;
      }

      return this.generateRelevantContext(history);
    } catch (error) {
      console.error(`Error getting relevant context for client ${clientId}:`, error);
      return null;
    }
  }

  private async processConversationHistory(
    clientId: string,
    conversationHistory: any[]
  ): Promise<ClientHistoryContext> {
    const sessions = this.extractSessionsFromHistory(conversationHistory);
    const patterns = this.analyzePatterns(conversationHistory);

    return {
      clientId,
      previousSessions: sessions,
      patterns,
      lastSessionDate: sessions.length > 0 ? sessions[sessions.length - 1].date : undefined,
    };
  }

  private extractSessionsFromHistory(conversationHistory: any[]): Array<{
    sessionId: string;
    date: string;
    keyInsights: string[];
    overallScore: number;
    progressAreas: string[];
  }> {
    const sessions = [];
    
    for (const message of conversationHistory) {
      if (message.ai_message && message.ai_message.includes('COACHING SESSION SUMMARY')) {
        const session = this.parseSessionFromMessage(message);
        if (session) {
          sessions.push(session);
        }
      }
    }

    return sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private parseSessionFromMessage(message: any): {
    sessionId: string;
    date: string;
    keyInsights: string[];
    overallScore: number;
    progressAreas: string[];
  } | null {
    try {
      const content = message.ai_message;
      const lines = content.split('\n');

      const sessionId = message.SessionId || 'unknown';
      let date = message.timestamp || new Date().toISOString();
      let overallScore = 0;
      const keyInsights: string[] = [];
      const progressAreas: string[] = [];

      let inInsightsSection = false;
      let inAnalysisSection = false;

      for (const line of lines) {
        if (line.startsWith('Date:')) {
          date = line.replace('Date:', '').trim();
        } else if (line.includes('Overall Score:')) {
          const scoreMatch = line.match(/(\d+(?:\.\d+)?)/);
          if (scoreMatch) {
            overallScore = parseFloat(scoreMatch[1]);
          }
        } else if (line === 'KEY INSIGHTS:') {
          inInsightsSection = true;
          inAnalysisSection = false;
        } else if (line === 'COACHING ANALYSIS:') {
          inInsightsSection = false;
          inAnalysisSection = true;
        } else if (line.startsWith('- ') && inInsightsSection) {
          keyInsights.push(line.substring(2).trim());
        } else if (line.startsWith('- ') && inAnalysisSection) {
          progressAreas.push(line.substring(2).trim());
        }
      }

      return {
        sessionId,
        date,
        keyInsights,
        overallScore,
        progressAreas,
      };
    } catch (error) {
      console.error('Error parsing session from message:', error);
      return null;
    }
  }

  private analyzePatterns(conversationHistory: any[]): {
    strengths: string[];
    challenges: string[];
    growth_areas: string[];
  } {
    const strengths: string[] = [];
    const challenges: string[] = [];
    const growth_areas: string[] = [];

    const allContent = conversationHistory
      .map(msg => msg.ai_message || msg.raw_message || '')
      .join(' ')
      .toLowerCase();

    // Analyze for common patterns
    if (allContent.includes('clear vision') || allContent.includes('goal')) {
      strengths.push('Good at articulating goals and vision');
    }

    if (allContent.includes('listening') || allContent.includes('attention')) {
      if (allContent.includes('need') || allContent.includes('improve')) {
        challenges.push('Active listening needs improvement');
      } else {
        strengths.push('Demonstrates good listening skills');
      }
    }

    if (allContent.includes('question') || allContent.includes('inquiry')) {
      if (allContent.includes('more') || allContent.includes('better')) {
        growth_areas.push('Develop more powerful questioning techniques');
      } else {
        strengths.push('Uses effective questioning');
      }
    }

    if (allContent.includes('energy') || allContent.includes('engagement')) {
      if (allContent.includes('low') || allContent.includes('lacking')) {
        challenges.push('Energy and engagement levels');
      } else {
        strengths.push('Maintains good energy and engagement');
      }
    }

    // Add some default growth areas if none found
    if (growth_areas.length === 0) {
      growth_areas.push('Continue developing coaching presence');
    }

    return { strengths, challenges, growth_areas };
  }

  private generateProgressSummary(history: ClientHistoryContext): string {
    const parts = [];
    
    parts.push(`CLIENT PROGRESS SUMMARY - ${history.previousSessions.length} Previous Sessions`);
    parts.push('');

    if (history.lastSessionDate) {
      parts.push(`Last Session: ${new Date(history.lastSessionDate).toLocaleDateString()}`);
    }

    if (history.previousSessions.length > 0) {
      const averageScore = history.previousSessions.reduce((sum, s) => sum + s.overallScore, 0) / history.previousSessions.length;
      parts.push(`Average Coaching Score: ${averageScore.toFixed(1)}/10`);

      const trend = this.calculateTrend(history.previousSessions);
      parts.push(`Progress Trend: ${trend}`);
    }

    parts.push('');
    parts.push('STRENGTHS:');
    history.patterns.strengths.forEach(strength => {
      parts.push(`- ${strength}`);
    });

    parts.push('');
    parts.push('GROWTH AREAS:');
    history.patterns.growth_areas.forEach(area => {
      parts.push(`- ${area}`);
    });

    if (history.patterns.challenges.length > 0) {
      parts.push('');
      parts.push('CHALLENGES TO ADDRESS:');
      history.patterns.challenges.forEach(challenge => {
        parts.push(`- ${challenge}`);
      });
    }

    return parts.join('\n');
  }

  private generateRelevantContext(
    history: ClientHistoryContext
  ): string {
    const parts = [];
    
    parts.push('RELEVANT CLIENT CONTEXT:');
    
    if (history.previousSessions.length > 0) {
      const recentSession = history.previousSessions[history.previousSessions.length - 1];
      parts.push(`Last session (${new Date(recentSession.date).toLocaleDateString()}):`);
      
      if (recentSession.keyInsights.length > 0) {
        parts.push('Key insights:');
        recentSession.keyInsights.slice(0, 3).forEach(insight => {
          parts.push(`- ${insight}`);
        });
      }
    }

    parts.push('');
    parts.push('FOCUS AREAS FOR THIS SESSION:');
    history.patterns.growth_areas.slice(0, 3).forEach(area => {
      parts.push(`- ${area}`);
    });

    if (history.patterns.challenges.length > 0) {
      parts.push('');
      parts.push('AREAS NEEDING ATTENTION:');
      history.patterns.challenges.slice(0, 2).forEach(challenge => {
        parts.push(`- ${challenge}`);
      });
    }

    return parts.join('\n');
  }

  private calculateTrend(sessions: Array<{ overallScore: number; date: string }>): string {
    if (sessions.length < 2) return 'Insufficient data';

    const recent = sessions.slice(-3);
    const earlier = sessions.slice(-6, -3);

    if (earlier.length === 0) return 'Building baseline';

    const recentAvg = recent.reduce((sum, s) => sum + s.overallScore, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, s) => sum + s.overallScore, 0) / earlier.length;

    const difference = recentAvg - earlierAvg;

    if (difference > 0.5) return 'Improving';
    if (difference < -0.5) return 'Needs attention';
    return 'Stable';
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  private cacheHistory(cacheKey: string, history: ClientHistoryContext): void {
    this.historyCache.set(cacheKey, history);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
  }

  clearCache(): void {
    this.historyCache.clear();
    this.cacheExpiry.clear();
  }

  getCacheStats(): { entries: number; hitRate: number } {
    return {
      entries: this.historyCache.size,
      hitRate: 0, // Could be implemented with hit/miss counters
    };
  }
}

export const personalAIHistoryService = new PersonalAIHistoryService();