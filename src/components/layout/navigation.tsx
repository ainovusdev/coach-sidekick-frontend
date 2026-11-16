'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/contexts/permission-context'
import { UserNav } from '@/components/auth/user-nav'
import { RoleSwitcher } from '@/components/auth/role-switcher'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { AskSidekickBar } from '@/components/agent/ask-sidekick-bar'
import {
  BarChart3,
  UserCheck,
  History,
  BookOpen,
  Eye,
  Target,
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * The coach app header: two rows.
 *
 * Row 1 holds the logo, the Ask Sidekick launcher, the bell, the role switcher
 * and the account menu (which also holds the theme). Row 2 holds the page tabs,
 * and scrolls sideways on a phone instead of disappearing.
 *
 * The header is sticky and `--app-header-h` (globals.css) is its height. Pages
 * that pin things below it or size themselves to the viewport read that
 * variable, so change both together.
 */
export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, roles } = useAuth()
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
      path: '/commitments',
      label: 'Commitments',
      icon: Target,
      permission: { resource: 'clients', action: 'view' },
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

  // On a phone the tab row scrolls; bring the current page's tab into view
  // so "Commitments" or "Resources" isn't hidden past the edge.
  const tabsRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const nav = tabsRef.current
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!nav || !active) return
    const n = nav.getBoundingClientRect()
    const a = active.getBoundingClientRect()
    if (a.left < n.left || a.right > n.right) {
      nav.scrollLeft += a.left - n.left - 16
    }
  }, [pathname, navItems.length])

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
      <header className="sticky top-0 z-50 border-b border-line bg-paper">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Row 1: brand, Ask Sidekick, account */}
          <div className="flex h-14 items-center gap-3 sm:gap-4">
            <Link
              href="/"
              aria-label="Coach Sidekick home"
              className="group flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent/40"
            >
              <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-brand-tile p-1.5 transition-transform group-hover:scale-105">
                <Image
                  src="/novus-global-logo.webp"
                  alt=""
                  width={28}
                  height={28}
                  className="object-contain filter brightness-0 invert"
                />
              </span>
              <span className="hidden text-lg font-bold text-ink xl:inline">
                Coach Sidekick
              </span>
            </Link>

            {isAuthenticated ? (
              <div className="flex min-w-0 flex-1 justify-center">
                {/* Full search field from `sm`; icon only on a phone. */}
                <AskSidekickBar className="flex w-9 justify-center p-2.5 [&>kbd]:hidden [&>span]:hidden sm:w-full sm:max-w-md sm:justify-start sm:px-3 sm:[&>kbd]:inline-block sm:[&>span]:block lg:w-full" />
              </div>
            ) : (
              <div className="flex-1" />
            )}

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {isAuthenticated && (
                <>
                  <NotificationBell />
                  <RoleSwitcher />
                </>
              )}
              <UserNav />
            </div>
          </div>

          {/* Row 2: page tabs. Scrolls sideways when it doesn't fit. */}
          <nav
            ref={tabsRef}
            aria-label="Main"
            className="-mx-4 flex h-11 items-end overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
          >
            <ul className="flex items-end gap-1 sm:gap-2">
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
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'relative flex h-11 items-center gap-2 whitespace-nowrap px-2.5 text-sm font-medium transition-colors',
                        'rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ds-accent/40',
                        "after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:content-['']",
                        isActive
                          ? 'text-ink after:bg-ink'
                          : 'text-ink-3 hover:text-ink hover:after:bg-line-strong',
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </header>
    </>
  )
}
