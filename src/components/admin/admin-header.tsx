'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { RoleSwitcher } from '@/components/auth/role-switcher'
import { User, LogOut, Settings, Shield } from 'lucide-react'

export function AdminHeader() {
  const { signOut, roles } = useAuth()

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-vermillion-bg text-vermillion border-vermillion '
      case 'admin':
        return 'bg-ds-accent-bg text-ds-accent border-ds-accent '
      case 'coach':
        return 'bg-forest-bg text-forest border-forest '
      case 'viewer':
        return 'bg-surface-3 text-ink-2 border-line '
      default:
        return 'bg-surface-3 text-ink-2 border-line '
    }
  }

  const formatRoleName = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <header className="bg-surface-1 shadow-sm border-b border-line ">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-ink ">
                Administration
              </h1>
              <p className="text-sm text-ink-3 mt-1">
                Manage users, roles, and client access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Badges */}
            <div className="flex items-center gap-2">
              {roles.map(role => (
                <Badge
                  key={role}
                  variant="outline"
                  className={cn('text-xs', getRoleBadgeColor(role))}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {formatRoleName(role)}
                </Badge>
              ))}
            </div>

            {/* Role Switcher */}
            <RoleSwitcher />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="h-8 w-8 rounded-full bg-surface-3 flex items-center justify-center">
                    <User className="h-4 w-4 text-ink-3 " />
                  </div>
                  <span className="text-sm font-medium">Admin User</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-vermillion"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
