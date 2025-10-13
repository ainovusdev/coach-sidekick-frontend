'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import authService from '@/services/auth-service'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner' // NEW: Add Sonner toasts

interface AuthContextType {
  isAuthenticated: boolean
  userId: string | null
  user: { id: string; email: string; full_name?: string | null } | null
  loading: boolean
  roles: string[]
  clientAccess: string[]
  ownClientId: string | null // NEW: User's own client profile ID
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
  isClient: () => boolean // NEW
  hasClientAccess: (clientId: string) => boolean
  canAccessClientView: () => boolean // NEW
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
  const [user, setUser] = useState<{
    id: string
    email: string
    full_name?: string | null
  } | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [clientAccess, setClientAccess] = useState<string[]>([])
  const [ownClientId, setOwnClientId] = useState<string | null>(null) // NEW
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
        const userClientId = authService.getOwnClientId() // NEW

        console.log('Auth Context - Loading roles:', userRoles)

        setUserId(id)
        setUser(id ? { id, email: email || '', full_name: fullName } : null)
        setRoles(userRoles)
        setClientAccess(userClientAccess)
        setOwnClientId(userClientId) // NEW
      }

      setLoading(false)
    }

    checkAuth()
  }, [])

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      await authService.signup({ email, password, full_name: fullName })
      // After successful signup, user needs to login
      toast.success('Account Created!', {
        description:
          'Your account has been created successfully. Please log in.',
        duration: 4000,
      })
      return { error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sign up'
      toast.error('Signup Failed', {
        description: errorMessage,
        duration: 5000,
      })
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
      const userRoles = authService.getRoles()

      setUserId(id)
      setUser(
        id ? { id, email: userEmail || email, full_name: fullName } : null,
      )
      setRoles(userRoles)
      setClientAccess(authService.getClientAccess())
      setOwnClientId(authService.getOwnClientId())

      // NEW: Success toast
      toast.success('Welcome Back!', {
        description: `Logged in as ${fullName || email}`,
        duration: 3000,
      })

      // Smart redirect based on roles
      if (authService.isAdmin()) {
        router.push('/admin/dashboard')
      } else if (authService.isCoach()) {
        router.push('/')
      } else if (authService.isClient()) {
        router.push('/client-portal/dashboard')
      } else {
        router.push('/')
      }

      return { error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid email or password'
      toast.error('Login Failed', {
        description: errorMessage,
        duration: 5000,
      })
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
      setOwnClientId(null)

      // NEW: Success toast
      toast.success('Logged Out', {
        description: 'You have been logged out successfully.',
        duration: 3000,
      })

      // Redirect to main auth page
      router.push('/auth')

      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Logout Failed', {
        description: 'There was a problem logging out. Please try again.',
        duration: 4000,
      })
      return {
        error: error instanceof Error ? error : new Error('Failed to sign out'),
      }
    }
  }

  // Role helper functions
  const hasRole = (role: string) => roles.includes(role)
  const hasAnyRole = (checkRoles: string[]) =>
    checkRoles.some(role => roles.includes(role))
  const isAdmin = () => hasAnyRole(['super_admin', 'admin'])
  const isSuperAdmin = () => hasRole('super_admin')
  const isCoach = () => hasRole('coach')
  const isViewer = () => hasRole('viewer')
  const isClient = () => hasRole('client') // NEW

  const hasClientAccess = (clientId: string) => {
    if (isAdmin()) return true
    return clientAccess.includes(clientId)
  }

  // NEW: Check if user can access client portal
  const canAccessClientView = () => {
    return isClient() && ownClientId !== null
  }

  const value: AuthContextType = {
    isAuthenticated,
    userId,
    user,
    loading,
    roles,
    clientAccess,
    ownClientId, // NEW
    signUp,
    signIn,
    signOut,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isCoach,
    isViewer,
    isClient, // NEW
    hasClientAccess,
    canAccessClientView, // NEW
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
