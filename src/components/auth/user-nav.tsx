'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar, LogOut, Moon, Palette, Shield, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'

export function UserNav() {
  const { isAuthenticated, signOut, user, roles, hasAnyRole } = useAuth()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  // The header's Admin button is gone; the role switcher covers Admin for
  // anyone with two roles. This covers an admin with only the one role.
  const showAdminLink =
    hasAnyRole(['admin', 'super_admin']) && roles.length <= 1

  if (!isAuthenticated) return null

  const handleSignOut = async () => {
    await signOut()
  }

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => router.push('/settings?tab=profile')}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => router.push('/settings?tab=preferences')}
          className="cursor-pointer"
        >
          <Palette className="mr-2 h-4 w-4" />
          <span>Coaching Preferences</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => router.push('/settings?tab=profile#integrations')}
          className="cursor-pointer"
        >
          <Calendar className="mr-2 h-4 w-4" />
          <span>Integrations</span>
        </DropdownMenuItem>
        {showAdminLink && (
          <DropdownMenuItem
            onSelect={() => router.push('/admin/dashboard')}
            className="cursor-pointer"
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>Admin dashboard</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          // Keep the menu open so the change is visible in place.
          onSelect={e => {
            e.preventDefault()
            setTheme(isDark ? 'light' : 'dark')
          }}
          role="menuitemcheckbox"
          aria-checked={isDark}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span className="flex-1">Dark mode</span>
          <Switch
            checked={isDark}
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none"
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
