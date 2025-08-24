import axios from 'axios'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: string
  email: string
  full_name: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  full_name?: string
}

// JWT payload interface
interface JWTPayload {
  sub: string // user id
  exp: number
}

class AuthService {
  private static instance: AuthService
  private token: string | null = null

  private constructor() {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
      this.setupAxiosInterceptors()
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private setupAxiosInterceptors(): void {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      config => {
        if (this.token && config.url?.startsWith(API_BASE_URL)) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      error => Promise.reject(error),
    )

    // Response interceptor to handle 401 errors
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          this.clearAuthData()
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/auth'
          }
        }
        return Promise.reject(error)
      },
    )
  }

  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    try {
      const response = await axios.post<TokenResponse>(
        `${API_BASE_URL}/auth/login`,
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      this.setAuthData(response.data)
      return response.data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async signup(credentials: SignupCredentials): Promise<void> {
    try {
      // Register doesn't return a token, user needs to login after
      await axios.post(`${API_BASE_URL}/auth/register`, credentials, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  async logout(): Promise<void> {
    // Simply clear local data since backend doesn't have logout endpoint
    this.clearAuthData()
  }

  private setAuthData(authData: TokenResponse): void {
    this.token = authData.access_token

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', authData.access_token)
    }
  }

  private clearAuthData(): void {
    this.token = null

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  getUserIdFromToken(): string | null {
    if (!this.token) return null

    try {
      // Decode JWT token (simple base64 decode, not verification)
      const payload = this.token.split('.')[1]
      const decoded = JSON.parse(atob(payload)) as JWTPayload
      return decoded.sub
    } catch (error) {
      console.error('Failed to decode token:', error)
      return null
    }
  }

  isAuthenticated(): boolean {
    if (!this.token) return false

    try {
      // Check if token is expired
      const payload = this.token.split('.')[1]
      const decoded = JSON.parse(atob(payload)) as JWTPayload
      const currentTime = Date.now() / 1000
      return decoded.exp > currentTime
    } catch (error) {
      console.error('Failed to check token expiry:', error)
      return false
    }
  }
}

export default AuthService.getInstance()
