import axiosInstance from '@/lib/axios-config'

const _API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: string
  email: string
  full_name: string | null
  roles?: string[]
  client_access?: string[]
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
  roles?: string[]
  client_access?: string[]
}

class AuthService {
  private static instance: AuthService
  private token: string | null = null
  private userRoles: string[] = []
  private clientAccess: string[] = []

  private constructor() {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')

      // If we have a token, extract roles from it rather than localStorage
      // This ensures we always have the most up-to-date roles
      if (this.token) {
        try {
          const payload = this.token.split('.')[1]
          const decoded = JSON.parse(atob(payload)) as JWTPayload
          this.userRoles = decoded.roles || []
          this.clientAccess = decoded.client_access || []

          // Also update localStorage to keep it in sync
          localStorage.setItem('user_roles', JSON.stringify(this.userRoles))
          localStorage.setItem(
            'client_access',
            JSON.stringify(this.clientAccess),
          )
        } catch (error) {
          console.error('Failed to decode token:', error)
          // Fall back to localStorage
          const storedRoles = localStorage.getItem('user_roles')
          const storedClientAccess = localStorage.getItem('client_access')

          if (storedRoles) {
            try {
              this.userRoles = JSON.parse(storedRoles)
            } catch {
              this.userRoles = []
            }
          }

          if (storedClientAccess) {
            try {
              this.clientAccess = JSON.parse(storedClientAccess)
            } catch {
              this.clientAccess = []
            }
          }
        }
      } else {
        this.userRoles = []
        this.clientAccess = []
      }

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
    // Interceptors are now handled in axios-config.ts
    // This method is kept for backward compatibility but does nothing
  }

  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    try {
      const response = await axiosInstance.post<TokenResponse>(
        '/auth/login',
        credentials,
      )

      // Store auth data including roles from response
      const tokenData = response.data
      this.setAuthData({
        ...tokenData,
        roles: tokenData.roles || [],
        client_access: tokenData.client_access || [],
      })
      return tokenData
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async signup(credentials: SignupCredentials): Promise<void> {
    try {
      // Register doesn't return a token, user needs to login after
      await axiosInstance.post('/auth/register', credentials)
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
    this.userRoles = authData.roles || []
    this.clientAccess = authData.client_access || []

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', authData.access_token)
      localStorage.setItem('user_roles', JSON.stringify(this.userRoles))
      localStorage.setItem('client_access', JSON.stringify(this.clientAccess))
      localStorage.setItem('user_email', authData.email || '')
      localStorage.setItem('user_full_name', authData.full_name || '')
    }
  }

  private clearAuthData(): void {
    this.token = null
    this.userRoles = []
    this.clientAccess = []

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_roles')
      localStorage.removeItem('client_access')
      localStorage.removeItem('user_email')
      localStorage.removeItem('user_full_name')
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

  getEmailFromToken(): string | null {
    // For now, we'll store this when we get the login response
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_email')
    }
    return null
  }

  getFullNameFromToken(): string | null {
    // For now, we'll store this when we get the login response
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_full_name')
    }
    return null
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

  // Role management methods
  getRoles(): string[] {
    // Always try to get fresh roles from the token if available
    if (this.token) {
      try {
        const payload = this.token.split('.')[1]
        const decoded = JSON.parse(atob(payload)) as JWTPayload
        this.userRoles = decoded.roles || []
        // Update localStorage to keep it in sync
        if (this.userRoles.length > 0) {
          localStorage.setItem('user_roles', JSON.stringify(this.userRoles))
        }
      } catch (error) {
        console.error('Failed to decode token for roles:', error)
      }
    }
    return this.userRoles
  }

  hasRole(role: string): boolean {
    const currentRoles = this.getRoles()
    return currentRoles.includes(role)
  }

  hasAnyRole(roles: string[]): boolean {
    const currentRoles = this.getRoles()
    return roles.some(role => currentRoles.includes(role))
  }

  hasAllRoles(roles: string[]): boolean {
    const currentRoles = this.getRoles()
    return roles.every(role => currentRoles.includes(role))
  }

  isSuperAdmin(): boolean {
    return this.hasRole('super_admin')
  }

  isAdmin(): boolean {
    return this.hasAnyRole(['super_admin', 'admin'])
  }

  isCoach(): boolean {
    return this.hasRole('coach')
  }

  isViewer(): boolean {
    return this.hasRole('viewer')
  }

  // Client access methods
  getClientAccess(): string[] {
    return this.clientAccess
  }

  hasClientAccess(clientId: string): boolean {
    // Admins have access to all clients
    if (this.isAdmin()) return true
    return this.clientAccess.includes(clientId)
  }

  // Password reset methods
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await axiosInstance.post('/auth/request-password-reset', {
      email: email.toLowerCase(),
    })
    return response.data
  }

  async verifyResetToken(
    token: string,
  ): Promise<{ valid: boolean; email: string }> {
    const response = await axiosInstance.post('/auth/verify-reset-token', {
      token,
    })
    return response.data
  }

  async completePasswordReset(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const response = await axiosInstance.post('/auth/complete-password-reset', {
      token,
      new_password: newPassword,
    })
    return response.data
  }
}

export default AuthService.getInstance()
