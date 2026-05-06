'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Badge, badgeVariants } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppShell, type AppShellNavItem } from '@/components/layout/app-shell'
import { RoleSwitcher } from '@/components/auth/role-switcher'
import type { VariantProps } from 'class-variance-authority'
import {
  LayoutDashboard,
  Users,
  Users2,
  Shield,
  Network,
  FolderKanban,
  BookOpen,
  User,
  LogOut,
  Settings,
} from 'lucide-react'

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

interface AdminShellProps {
  children: ReactNode
}

const ADMIN_ITEMS: Array<AppShellNavItem & { roles: string[] }> = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
    roles: ['admin', 'super_admin'],
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
    roles: ['admin', 'super_admin'],
  },
  {
    href: '/admin/programs',
    label: 'Sandboxes',
    icon: FolderKanban,
    roles: ['super_admin'],
  },
  {
    href: '/admin/clients',
    label: 'Clients',
    icon: Users2,
    roles: ['super_admin'],
  },
  {
    href: '/admin/resources',
    label: 'Global Resources',
    icon: BookOpen,
    roles: ['admin', 'super_admin'],
  },
  {
    href: '/admin/access',
    label: 'Access Management',
    icon: Network,
    roles: ['admin', 'super_admin'],
  },
  {
    href: '/admin/roles',
    label: 'Roles',
    icon: Shield,
    roles: ['super_admin'],
  },
]

const ROLE_TO_BADGE: Record<string, BadgeVariant> = {
  super_admin: 'bad',
  admin: 'info',
  coach: 'ok',
  viewer: 'neutral',
  client: 'neutral',
  trainee: 'ok',
}

const formatRoleName = (role: string) =>
  role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

/**
 * Admin app shell. Renders `<AppShell variant="sidebar">` with the admin
 * left rail, role-filtered nav items, and a top action bar containing role
 * badges, RoleSwitcher, and the user menu.
 */
export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter()
  const { hasAnyRole, roles, signOut, user } = useAuth()

  const navItems = ADMIN_ITEMS.filter(item => hasAnyRole(item.roles)).map(
    ({ roles: _roles, ...rest }) => rest,
  )

  const navActions = (
    <>
      <div className="hidden md:flex items-center gap-2">
        {roles.map(role => (
          <Badge key={role} variant={ROLE_TO_BADGE[role] ?? 'neutral'}>
            <Shield className="h-3 w-3" />
            {formatRoleName(role)}
          </Badge>
        ))}
      </div>
      <RoleSwitcher />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <div className="h-7 w-7 rounded-sm bg-surface-2 flex items-center justify-center">
              <User className="h-4 w-4 text-ink-3" />
            </div>
            <span className="hidden sm:inline">
              {user?.full_name || 'Admin User'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push('/profile')}>
            <User className="h-4 w-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => signOut()}
            className="text-vermillion focus:text-vermillion"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )

  return (
    <AppShell
      variant="sidebar"
      brand={{
        label: 'Admin Panel',
        subtitle: 'Coach Sidekick',
        href: '/admin/dashboard',
      }}
      navItems={navItems}
      navActions={navActions}
    >
      <div className="container mx-auto px-6 py-8">{children}</div>
    </AppShell>
  )
}
