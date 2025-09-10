'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { useAuth } from './auth-context'

interface PermissionMatrix {
  user: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
  }
  clients: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
  }
  client: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
  }
  sessions: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
  }
  transcript: {
    view: boolean
  }
  insights: {
    view: boolean
    generate: boolean
  }
  persona: {
    view: boolean
  }
  analytics: {
    view: boolean
  }
  data: {
    export: boolean
  }
  sensitive_info: {
    view: boolean
  }
  access: {
    view: boolean
    manage: boolean
  }
}

interface PermissionContextType {
  permissions: PermissionMatrix
  hasPermission: (resource: keyof PermissionMatrix, action: string) => boolean
  canViewTranscript: (clientId?: string) => boolean
  canGenerateInsights: (clientId?: string) => boolean
  canEditClient: (clientId?: string) => boolean
  canDeleteClient: (clientId?: string) => boolean
  canManageUser: (userId?: string) => boolean
  canAssignRoles: () => boolean
  canViewSensitiveInfo: () => boolean
  canExportData: () => boolean
  canViewAnalytics: () => boolean
  canViewPersona: () => boolean
  canCreateClient: () => boolean
  isViewerOnly: () => boolean
  isCoach: () => boolean
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  isViewer: () => boolean
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

// Define permissions for each role
const ROLE_PERMISSIONS: Record<string, PermissionMatrix> = {
  super_admin: {
    user: { view: true, create: true, edit: true, delete: true },
    clients: { view: true, create: true, edit: true, delete: true },
    client: { view: true, create: true, edit: true, delete: true },
    sessions: { view: true, create: true, edit: true, delete: true },
    transcript: { view: true },
    insights: { view: true, generate: true },
    persona: { view: true },
    analytics: { view: true },
    data: { export: true },
    sensitive_info: { view: true },
    access: { view: true, manage: true }
  },
  admin: {
    user: { view: true, create: true, edit: true, delete: false },
    clients: { view: true, create: true, edit: true, delete: true },
    client: { view: true, create: true, edit: true, delete: true },
    sessions: { view: true, create: true, edit: true, delete: true },
    transcript: { view: true },
    insights: { view: true, generate: true },
    persona: { view: true },
    analytics: { view: true },
    data: { export: true },
    sensitive_info: { view: true },
    access: { view: true, manage: true }
  },
  coach: {
    user: { view: false, create: false, edit: false, delete: false },
    clients: { view: true, create: true, edit: true, delete: true },
    client: { view: true, create: true, edit: true, delete: true },
    sessions: { view: true, create: true, edit: true, delete: true },
    transcript: { view: true },
    insights: { view: true, generate: true },
    persona: { view: true },
    analytics: { view: true },
    data: { export: true },
    sensitive_info: { view: true },
    access: { view: false, manage: false }
  },
  viewer: {
    user: { view: false, create: false, edit: false, delete: false },
    clients: { view: true, create: false, edit: false, delete: false },
    client: { view: true, create: false, edit: false, delete: false },
    sessions: { view: true, create: false, edit: false, delete: false },
    transcript: { view: false },
    insights: { view: true, generate: false },
    persona: { view: true },
    analytics: { view: true },
    data: { export: false },
    sensitive_info: { view: false },
    access: { view: false, manage: false }
  }
}

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { roles, hasRole, hasAnyRole, clientAccess: _clientAccess } = useAuth()

  // Calculate effective permissions based on highest role
  const permissions = useMemo(() => {
    // Start with most restrictive permissions
    let effectivePermissions: PermissionMatrix = ROLE_PERMISSIONS.viewer

    // Check roles in order of precedence
    if (hasRole('super_admin')) {
      effectivePermissions = ROLE_PERMISSIONS.super_admin
    } else if (hasRole('admin')) {
      effectivePermissions = ROLE_PERMISSIONS.admin
    } else if (hasRole('coach')) {
      effectivePermissions = ROLE_PERMISSIONS.coach
    } else if (hasRole('viewer')) {
      effectivePermissions = ROLE_PERMISSIONS.viewer
    }

    return effectivePermissions
  }, [roles, hasRole]) // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue: PermissionContextType = {
    permissions,

    hasPermission: (resource: keyof PermissionMatrix, action: string) => {
      const resourcePermissions = permissions[resource]
      if (!resourcePermissions) return false
      return resourcePermissions[action as keyof typeof resourcePermissions] === true
    },

    canViewTranscript: (clientId?: string) => {
      // Check basic permission
      if (!permissions.transcript.view) return false
      
      // If clientId provided, check client access
      if (clientId && !hasRole('super_admin')) {
        if (hasRole('admin')) {
          // Admin needs coach assignment or direct client access
          // This would need to be checked against actual data
          return true // For now, assume admin has access
        }
        if (hasRole('coach')) {
          // Coach needs to own the client
          // This would need to be checked against actual data
          return true // For now, assume coach has access
        }
        // Viewer cannot see transcripts
        return false
      }
      
      return permissions.transcript.view
    },

    canGenerateInsights: (_clientId?: string) => {
      return permissions.insights.generate
    },

    canEditClient: (clientId?: string) => {
      if (!permissions.client.edit) return false
      
      // Additional checks for specific client could go here
      if (clientId && hasRole('coach')) {
        // Coach can only edit their own clients
        // This would need to be checked against actual data
        return true
      }
      
      return permissions.client.edit
    },

    canDeleteClient: (clientId?: string) => {
      if (!permissions.client.delete) return false
      
      // Additional checks for specific client could go here
      if (clientId && hasRole('coach')) {
        // Coach can only delete their own clients
        // This would need to be checked against actual data
        return true
      }
      
      return permissions.client.delete
    },

    canManageUser: (_userId?: string) => {
      return permissions.user.edit || permissions.user.create
    },

    canAssignRoles: () => {
      return hasAnyRole(['super_admin', 'admin'])
    },

    canViewSensitiveInfo: () => {
      return permissions.sensitive_info.view
    },

    canExportData: () => {
      return permissions.data.export
    },

    canViewAnalytics: () => {
      return permissions.analytics.view
    },

    canViewPersona: () => {
      return permissions.persona.view
    },

    canCreateClient: () => {
      return permissions.client.create
    },

    isViewerOnly: () => {
      return hasRole('viewer') && !hasAnyRole(['super_admin', 'admin', 'coach'])
    },

    isViewer: () => {
      return hasRole('viewer')
    },

    isCoach: () => {
      return hasRole('coach')
    },

    isAdmin: () => {
      return hasRole('admin')
    },

    isSuperAdmin: () => {
      return hasRole('super_admin')
    }
  }

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}

// Permission Gate component for conditional rendering
interface PermissionGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  resource?: keyof PermissionMatrix
  action?: string
  require?: {
    resource?: keyof PermissionMatrix
    action?: string
    customCheck?: () => boolean
  }
}

export function PermissionGate({ 
  children, 
  fallback = null,
  resource,
  action,
  require 
}: PermissionGateProps) {
  const permissions = usePermissions()
  
  // Check direct resource/action props
  if (resource && action) {
    const hasPermission = permissions.hasPermission(resource, action)
    return hasPermission ? <>{children}</> : <>{fallback}</>
  }
  
  // Check require prop for backwards compatibility
  if (require) {
    // Check custom permission function
    if (require.customCheck) {
      return require.customCheck() ? <>{children}</> : <>{fallback}</>
    }
    
    // Check resource/action permission
    if (require.resource && require.action) {
      const hasPermission = permissions.hasPermission(require.resource, require.action)
      return hasPermission ? <>{children}</> : <>{fallback}</>
    }
  }
  
  // If no requirements specified, render children
  return <>{children}</>
}