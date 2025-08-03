interface Config {
  recall: {
    apiKey: string | null
    apiUrl: string
  }
  webhook: {
    baseUrl: string
  }
  app: {
    environment: 'development' | 'production' | 'test'
    port: number
  }
  backend: {
    url: string
  }
  isConfigured: boolean
}

function getWebhookBaseUrl(): string {
  // Priority: WEBHOOK_BASE_URL > VERCEL_URL > localhost
  if (process.env.WEBHOOK_BASE_URL) {
    return process.env.WEBHOOK_BASE_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'http://localhost:3000'
}

function getEnvironment(): 'development' | 'production' | 'test' {
  const env = process.env.NODE_ENV || 'development'
  if (env === 'production' || env === 'test') {
    return env
  }
  return 'development'
}

// Check if required environment variables are set
const hasRequiredConfig = !!process.env.RECALL_API_KEY

export const config: Config = {
  recall: {
    apiKey: process.env.RECALL_API_KEY || null,
    apiUrl: process.env.RECALL_API_URL || 'https://us-west-2.recall.ai/api/v1',
  },
  webhook: {
    baseUrl: getWebhookBaseUrl(),
  },
  app: {
    environment: getEnvironment(),
    port: parseInt(process.env.PORT || '3000', 10),
  },
  backend: {
    url: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api/v1',
  },
  isConfigured: hasRequiredConfig,
}

// Helper functions for common config access patterns
export const getRecallHeaders = () => {
  if (!config.recall.apiKey) {
    throw new Error(
      'RECALL_API_KEY is not configured. Please check your environment variables.',
    )
  }

  return {
    Authorization: `Token ${config.recall.apiKey}`,
    'Content-Type': 'application/json',
  }
}

export const getWebhookUrl = (endpoint: string = '/api/recall/webhook') => {
  return `${config.webhook.baseUrl}${endpoint}`
}

export const isProduction = () => config.app.environment === 'production'
export const isDevelopment = () => config.app.environment === 'development'
export const isConfigured = () => config.isConfigured

if (!config.isConfigured) {
  console.warn(
    '⚠️  Missing required environment variables. Please set RECALL_API_KEY in your .env.local file.',
  )
}
