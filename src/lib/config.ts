interface Config {
  app: {
    environment: 'development' | 'production' | 'test'
    port: number
  }
  backend: {
    url: string
  }
  isConfigured: boolean
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
  app: {
    environment: getEnvironment(),
    port: parseInt(process.env.PORT || '3000', 10),
  },
  backend: {
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  },
  isConfigured: hasRequiredConfig,
}

export const isProduction = () => config.app.environment === 'production'
export const isDevelopment = () => config.app.environment === 'development'
export const isConfigured = () => config.isConfigured
