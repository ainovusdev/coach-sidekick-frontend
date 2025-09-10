'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import authService from '@/services/auth-service'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  userId: string | null
  user: { id: string; email: string; full_name?: string | null } | null
  loading: boolean
  roles: string[]
  clientAccess: string[]
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  // Role checking helpers
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  isCoach: () => boolean
  isViewer: () => boolean
  hasClientAccess: (clientId: string) => boolean
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
  const [user, setUser] = useState<{ id: string; email: string; full_name?: string | null } | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [clientAccess, setClientAccess] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing authentication on mount
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)

      if (authenticated) {
        const id = authService.getUserIdFromToken()
        const email = authService.getEmailFromToken()
        const fullName = authService.getFullNameFromToken()
        const userRoles = authService.getRoles()
        const userClientAccess = authService.getClientAccess()
        
        console.log('Auth Context - Loading roles:', userRoles)
        
        setUserId(id)
        setUser(id ? { id, email: email || '', full_name: fullName } : null)
        setRoles(userRoles)
        setClientAccess(userClientAccess)
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
      const userEmail = authService.getEmailFromToken()
      const fullName = authService.getFullNameFromToken()
      setUserId(id)
      setUser(id ? { id, email: userEmail || email, full_name: fullName } : null)
      setRoles(authService.getRoles())
      setClientAccess(authService.getClientAccess())

      // Redirect based on role
      if (authService.isAdmin()) {
        router.push('/admin/dashboard')
      } else {
        router.push('/')
      }

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
      setUser(null)
      setRoles([])
      setClientAccess([])

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

  // Role helper functions
  const hasRole = (role: string) => roles.includes(role)
  const hasAnyRole = (checkRoles: string[]) => checkRoles.some(role => roles.includes(role))
  const isAdmin = () => hasAnyRole(['super_admin', 'admin'])
  const isSuperAdmin = () => hasRole('super_admin')
  const isCoach = () => hasRole('coach')
  const isViewer = () => hasRole('viewer')
  const hasClientAccess = (clientId: string) => {
    if (isAdmin()) return true
    return clientAccess.includes(clientId)
  }

  const value: AuthContextType = {
    isAuthenticated,
    userId,
    user,
    loading,
    roles,
    clientAccess,
    signUp,
    signIn,
    signOut,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isCoach,
    isViewer,
    hasClientAccess,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
