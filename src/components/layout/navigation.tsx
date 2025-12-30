'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/contexts/permission-context'
import { UserNav } from '@/components/auth/user-nav'
import { RoleSwitcher } from '@/components/auth/role-switcher'
import { BarChart3, UserCheck, History, Sparkles, Shield } from 'lucide-react'
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
    // Knowledge hidden for now
    // {
    //   path: '/knowledge',
    //   label: 'Knowledge',
    //   icon: BookOpen,
    //   permission: null,
    // },
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
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
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
                  <h1 className="text-xl font-bold text-gray-900">
                    Coach Sidekick
                  </h1>
                </div>
                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                  <Sparkles className="w-3 h-3 text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">
                    Novus Global Powered AI
                  </span>
                </div>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center">
              <div className="flex items-center bg-gray-50 rounded-lg p-1">
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
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
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
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                    <div className="relative">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Active
                    </span>
                  </div>
                </div>

                {/* NEW: Role Switcher */}
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
