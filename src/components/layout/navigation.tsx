'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/contexts/permission-context'
import { UserNav } from '@/components/auth/user-nav'
import { RoleSwitcher } from '@/components/auth/role-switcher'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { BarChart3, UserCheck, History, BookOpen, Shield } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, hasAnyRole, roles } = useAuth() // NEW: Get roles
  const permissions = usePermissions()

  // NEW: Check if user is client-only (no coach/admin/viewer roles)
  const isClientOnly = roles.length === 1 && roles.includes('client')

  const isActivePath = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  // Filter navigation items based on permissions
  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3, permission: null },
    {
      path: '/clients',
      label: 'Clients',
      icon: UserCheck,
      permission: { resource: 'clients', action: 'view' },
    },
    {
      path: '/sessions',
      label: 'Sessions',
      icon: History,
      permission: { resource: 'sessions', action: 'view' },
    },
    {
      path: '/resources',
      label: 'Resources',
      icon: BookOpen,
      permission: null,
    },
  ]

  // NEW: Hide coach/admin nav items for client-only users
  const navItems = isClientOnly
    ? []
    : allNavItems.filter(item => {
        if (!item.permission) return true
        return permissions.hasPermission(
          item.permission.resource as any,
          item.permission.action as any,
        )
      })

  // Removed auto-redirect - handled by CoachRoute instead to prevent loops

  // NEW: Don't render navigation for client-only users (they have their own in client portal)
  if (isClientOnly) {
    return null
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-10">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gray-900 rounded-xl blur-sm opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative w-11 h-11 bg-gray-900 rounded-xl p-1.5 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Image
                    src="/novus-global-logo.webp"
                    alt="Novus Global Logo"
                    width={32}
                    height={32}
                    className="object-contain filter brightness-0 invert"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Coach Sidekick
                  </h1>
                </div>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center">
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
                {navItems.map(item => {
                  const Icon = item.icon
                  const isActive = isActivePath(item.path)

                  return (
                    <button
                      key={item.path}
                      onClick={() => router.push(item.path)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                        transition-all duration-200 cursor-pointer
                        ${
                          isActive
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <>
                <div className="hidden lg:flex items-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="relative">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active
                    </span>
                  </div>
                </div>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Role Switcher */}
                <RoleSwitcher />

                {/* Admin Button - Only show for admin and super_admin roles */}
                {hasAnyRole(['admin', 'super_admin']) && (
                  <Button
                    onClick={() => router.push('/admin/dashboard')}
                    variant={
                      pathname.startsWith('/admin') ? 'default' : 'outline'
                    }
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                )}
              </>
            )}

            <UserNav />
          </div>

          {/* Mobile Navigation Toggle - could be added if needed */}
        </div>
      </div>
    </header>
  )
}
