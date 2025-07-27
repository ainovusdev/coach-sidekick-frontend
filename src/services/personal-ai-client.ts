import {
  PersonalAIConfig,
  PersonalAIMessageRequest,
  PersonalAIMessageResponse,
  PersonalAIConversationRequest,
  PersonalAIConversationMessage,
  PersonalAIMemoryRequest,
  PersonalAIMemoryResponse,
  PersonalAIUploadTextRequest,
  PersonalAIError,
} from '@/types/personal-ai';

class PersonalAIClient {
  private config: PersonalAIConfig;
  private rateLimitDelay = 1000; // 1 second between requests

  constructor() {
    this.config = {
      apiKey: process.env.PERSONAL_AI_API_KEY || '',
      domainName: process.env.PERSONAL_AI_DOMAIN_NAME || '',
      baseUrl: 'https://api.personal.ai/v1',
    };

    if (!this.config.apiKey || !this.config.domainName) {
      throw new Error('Personal AI API key and domain name are required');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' = 'POST',
    data?: any
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: PersonalAIError = {
          error: `HTTP ${response.status}`,
          code: response.status,
          message: errorData.message || response.statusText,
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      
      throw {
        error: 'Network Error',
        code: 0,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      } as PersonalAIError;
    }
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const personalAIError = error as PersonalAIError;
        if (personalAIError.code === 403 || personalAIError.code === 404) {
          throw error;
        }
      }
    }
    throw new Error('Retry attempts exhausted');
  }

  async sendMessage(request: PersonalAIMessageRequest): Promise<PersonalAIMessageResponse> {
    return this.retryWithBackoff(() =>
      this.makeRequest<PersonalAIMessageResponse>('/message', 'POST', {
        ...request,
        DomainName: request.DomainName || this.config.domainName,
      })
    );
  }

  async getConversationHistory(
    sessionId: string,
    domainName?: string
  ): Promise<PersonalAIConversationMessage[]> {
    const request: PersonalAIConversationRequest = {
      SessionId: sessionId,
      DomainName: domainName || this.config.domainName,
    };

    return this.retryWithBackoff(() =>
      this.makeRequest<PersonalAIConversationMessage[]>('/conversation', 'POST', request)
    );
  }

  async uploadMemory(request: PersonalAIMemoryRequest): Promise<PersonalAIMemoryResponse> {
    return this.retryWithBackoff(() =>
      this.makeRequest<PersonalAIMemoryResponse>('/memory', 'POST', {
        ...request,
        DomainName: request.DomainName || this.config.domainName,
        SourceName: request.SourceName || 'Coach Sidekick',
      })
    );
  }

  async uploadText(request: PersonalAIUploadTextRequest): Promise<PersonalAIMemoryResponse> {
    return this.retryWithBackoff(() =>
      this.makeRequest<PersonalAIMemoryResponse>('/upload-text', 'POST', {
        ...request,
        DomainName: request.DomainName || this.config.domainName,
        SourceName: request.SourceName || 'Coach Sidekick',
      })
    );
  }

  generateClientSessionId(clientId: string, sessionId: string): string {
    return `coaching-${clientId}-${sessionId}`;
  }

  generateCoachSessionId(coachId: string): string {
    return `coach-${coachId}-${Date.now()}`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.sendMessage({
        Text: 'Health check',
        DomainName: this.config.domainName,
        SourceName: 'Coach Sidekick Health Check',
      });
      return true;
    } catch (error) {
      console.error('Personal AI health check failed:', error);
      return false;
    }
  }
}

export const personalAIClient = new PersonalAIClient();
export default PersonalAIClient;