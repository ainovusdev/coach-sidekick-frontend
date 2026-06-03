'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/contexts/permission-context'
import { UserNav } from '@/components/auth/user-nav'
import { RoleSwitcher } from '@/components/auth/role-switcher'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { AskSidekickBar } from '@/components/agent/ask-sidekick-bar'
import {
  BarChart3,
  UserCheck,
  History,
  BookOpen,
  Shield,
  Eye,
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, hasAnyRole, roles } = useAuth()
  const permissions = usePermissions()

  const isClientOnly = roles.length === 1 && roles.includes('client')

  const [impersonatedCoachName, setImpersonatedCoachName] = useState<
    string | null
  >(null)
  useEffect(() => {
    const name = sessionStorage.getItem('view_as_coach_name')
    setImpersonatedCoachName(name)
  }, [])

  const exitCoachImpersonation = () => {
    sessionStorage.removeItem('view_as_coach_id')
    sessionStorage.removeItem('view_as_coach_name')
    router.push('/admin/users')
  }

  const isActivePath = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

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

  const navItems = isClientOnly
    ? []
    : allNavItems.filter(item => {
        if (!item.permission) return true
        return permissions.hasPermission(
          item.permission.resource as any,
          item.permission.action as any,
        )
      })

  if (isClientOnly) {
    return null
  }

  return (
    <>
      {impersonatedCoachName && (
        <div className="bg-amber-token text-ink-on-dark px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-3 sticky top-0 z-[60]">
          <Eye className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span>Viewing as coach: {impersonatedCoachName}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={exitCoachImpersonation}
            className="h-7 text-xs"
          >
            Exit Preview
          </Button>
        </div>
      )}
      <header className="bg-paper border-b border-line sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-10">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-3 group"
              >
                <div className="relative w-11 h-11 bg-brand-tile rounded-xl p-1.5 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Image
                    src="/novus-global-logo.webp"
                    alt="Novus Global Logo"
                    width={32}
                    height={32}
                    className="object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold text-ink">Coach Sidekick</h1>
                </div>
              </button>

              <nav className="hidden md:flex items-center">
                <div className="flex items-center bg-surface-2 rounded-lg p-1">
                  {navItems.map(item => {
                    const Icon = item.icon
                    const isActive =
                      isActivePath(item.path) &&
                      !navItems.some(
                        other =>
                          other.path !== item.path &&
                          other.path.length > item.path.length &&
                          isActivePath(other.path),
                      )

                    return (
                      <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={`
                        flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                        transition-colors duration-200 cursor-pointer
                        ${
                          isActive
                            ? 'bg-paper text-ink shadow-xs'
                            : 'text-ink-3 hover:text-ink hover:bg-paper/60'
                        }
                      `}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {isAuthenticated && (
                <>
                  <AskSidekickBar />
                  <div className="hidden lg:flex items-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 rounded-lg">
                      <div className="relative">
                        <div className="w-2 h-2 bg-forest rounded-full"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-forest rounded-full animate-ping"></div>
                      </div>
                      <span className="text-sm font-medium text-ink-2">
                        Active
                      </span>
                    </div>
                  </div>

                  <ThemeToggle />

                  <RoleSwitcher />

                  {hasAnyRole(['admin', 'super_admin']) &&
                    !impersonatedCoachName && (
                      <Button
                        onClick={() => router.push('/admin/dashboard')}
                        variant={
                          pathname.startsWith('/admin') ? 'default' : 'outline'
                        }
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Shield className="h-4 w-4" strokeWidth={1.75} />
                        <span className="hidden sm:inline">Admin</span>
                      </Button>
                    )}
                </>
              )}

              <UserNav />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
