export interface PersonalAIConfig {
  apiKey: string;
  domainName: string;
  baseUrl: string;
}

export interface PersonalAIMessageRequest {
  Text: string;
  DomainName: string;
  Context?: string;
  UserName?: string;
  SessionId?: string;
  Events?: string;
  SourceName?: string;
  is_stack?: boolean;
  is_draft?: boolean;
}

export interface PersonalAIMessageResponse {
  ai_message: string;
  ai_score: number;
  SessionId: string;
}

export interface PersonalAIConversationRequest {
  SessionId: string;
  DomainName: string;
}

export interface PersonalAIConversationMessage {
  ai_message: string;
  ai_score: number;
  ai_name: string;
  ai_picture: string | null;
  raw_message: string;
  timestamp: string;
  SessionId: string;
  Metadata: Record<string, any>;
}

export interface PersonalAIMemoryRequest {
  Text: string;
  DomainName: string;
  DeviceName?: string;
  SourceName?: string;
  Title?: string;
  TimeStamp?: string;
  UserName?: string;
}

export interface PersonalAIMemoryResponse {
  success: boolean;
  message?: string;
  feedId?: string;
}

export interface PersonalAIError {
  error: string;
  code: number;
  message: string;
}

export interface PersonalAIUploadTextRequest {
  Text: string;
  DomainName: string;
  DeviceName?: string;
  SourceName?: string;
  Title?: string;
  TimeStamp?: string;
  UserName?: string;
}

export interface CoachingSessionMemory {
  sessionId: string;
  clientName?: string;
  coachName: string;
  sessionDate: string;
  sessionType: 'coaching' | 'discovery' | 'follow-up';
  keyInsights: string[];
  transcript: string;
  coachingAnalysis?: {
    overallScore: number;
    criteriaScores: Record<string, number>;
    suggestions: Array<{
      content: string;
      priority: 'high' | 'medium' | 'low';
      category: string;
    }>;
  };
}

export interface ClientHistoryContext {
  clientId: string;
  previousSessions: Array<{
    sessionId: string;
    date: string;
    keyInsights: string[];
    overallScore: number;
    progressAreas: string[];
  }>;
  patterns: {
    strengths: string[];
    challenges: string[];
    growth_areas: string[];
  };
  lastSessionDate?: string;
}