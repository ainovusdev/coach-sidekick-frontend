'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown, Shield, UserCheck, User } from 'lucide-react'

export function RoleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const { roles, hasRole } = useAuth()

  // Don't show if user has only one role
  if (roles.length <= 1) return null

  const roleViews: Array<{
    role: string
    label: string
    shortLabel: string
    icon: React.ElementType
    path: string
    description: string
  }> = []

  if (hasRole('super_admin') || hasRole('admin')) {
    roleViews.push({
      role: 'admin',
      label: 'Admin Dashboard',
      shortLabel: 'Admin',
      icon: Shield,
      path: '/admin',
      description: 'Manage users and access',
    })
  }

  if (hasRole('coach')) {
    roleViews.push({
      role: 'coach',
      label: 'Coach Dashboard',
      shortLabel: 'Coach',
      icon: UserCheck,
      path: '/',
      description: 'Manage clients and sessions',
    })
  }

  if (hasRole('client')) {
    roleViews.push({
      role: 'client',
      label: 'Client Portal',
      shortLabel: 'Client',
      icon: User,
      path: '/client-portal',
      description: 'View your progress',
    })
  }

  // Determine current view based on pathname
  const getCurrentView = () => {
    if (pathname.startsWith('/admin')) {
      return roleViews.find(v => v.role === 'admin')
    }
    if (pathname.startsWith('/client-portal')) {
      return roleViews.find(v => v.role === 'client')
    }
    // Default to coach view for other paths
    return roleViews.find(v => v.role === 'coach')
  }

  const currentView = getCurrentView()
  const CurrentIcon = currentView?.icon || UserCheck

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentView?.shortLabel || 'Switch View'}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Role View</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roleViews.map(view => {
          const Icon = view.icon
          const isCurrentView = currentView?.role === view.role
          const dashboardPath =
            view.role === 'admin'
              ? '/admin/dashboard'
              : view.role === 'client'
                ? '/client-portal/dashboard'
                : '/'
          return (
            <DropdownMenuItem
              key={view.role}
              onClick={() => router.push(dashboardPath)}
              className={`cursor-pointer ${isCurrentView ? 'bg-gray-100' : ''}`}
            >
              <div className="flex items-start gap-3 w-full">
                <Icon className="h-4 w-4 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">{view.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {view.description}
                  </div>
                </div>
                {isCurrentView && (
                  <div className="text-xs text-blue-600 font-medium mt-0.5">
                    Current
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
