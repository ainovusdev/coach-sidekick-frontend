'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import authService from '@/services/auth-service'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  userId: string | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing authentication on mount
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)

      if (authenticated) {
        const id = authService.getUserIdFromToken()
        setUserId(id)
      }

      setLoading(false)
    }

    checkAuth()
  }, [])

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      await authService.signup({ email, password, full_name: fullName })
      // After successful signup, user needs to login
      return { error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        error: error instanceof Error ? error : new Error('Failed to sign up'),
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await authService.login({ email, password })

      // Update auth state
      setIsAuthenticated(true)
      const id = authService.getUserIdFromToken()
      setUserId(id)

      // Redirect to dashboard
      router.push('/')

      return { error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        error: error instanceof Error ? error : new Error('Failed to sign in'),
      }
    }
  }

  const signOut = async () => {
    try {
      await authService.logout()

      // Update auth state
      setIsAuthenticated(false)
      setUserId(null)

      // Redirect to auth page
      router.push('/auth')

      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return {
        error: error instanceof Error ? error : new Error('Failed to sign out'),
      }
    }
  }

  const value: AuthContextType = {
    isAuthenticated,
    userId,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
