'use client'

import { useRouter } from 'next/navigation'
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
  const { roles, hasRole } = useAuth()

  // Don't show if user has only one role
  if (roles.length <= 1) return null

  const roleViews = []

  if (hasRole('super_admin') || hasRole('admin')) {
    roleViews.push({
      role: 'admin',
      label: 'Admin Dashboard',
      icon: Shield,
      path: '/admin/dashboard',
      description: 'Manage users and access',
    })
  }

  if (hasRole('coach')) {
    roleViews.push({
      role: 'coach',
      label: 'Coach Dashboard',
      icon: UserCheck,
      path: '/',
      description: 'Manage clients and sessions',
    })
  }

  if (hasRole('client')) {
    roleViews.push({
      role: 'client',
      label: 'Client Portal',
      icon: User,
      path: '/client-portal/dashboard',
      description: 'View your progress',
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <span className="hidden sm:inline">Switch View</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Role View</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roleViews.map(view => {
          const Icon = view.icon
          return (
            <DropdownMenuItem
              key={view.role}
              onClick={() => router.push(view.path)}
              className="cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <Icon className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-medium">{view.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {view.description}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
