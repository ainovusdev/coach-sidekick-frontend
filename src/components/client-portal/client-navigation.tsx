'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Home,
  MessageSquareText,
  UserRound,
  User,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Eye,
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { RoleSwitcher } from '@/components/auth/role-switcher'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const navItems = [
  {
    path: '/client-portal/dashboard',
    label: 'Home',
    icon: Home,
  },
  {
    path: '/client-portal/sessions',
    label: 'Sessions',
    icon: MessageSquareText,
  },
  {
    path: '/client-portal/persona',
    label: 'Coaching Profile',
    icon: UserRound,
  },
]

export function ClientNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, signOut, user, roles } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check if user has other roles besides client
  const hasOtherRoles = roles.some(role => role !== 'client')

  // Impersonation state
  const [impersonatedClientName, setImpersonatedClientName] = useState<
    string | null
  >(null)
  useEffect(() => {
    const name = sessionStorage.getItem('view_as_client_name')
    setImpersonatedClientName(name)
  }, [])

  const exitClientImpersonation = () => {
    const clientId = sessionStorage.getItem('view_as_client_id')
    sessionStorage.removeItem('view_as_client_id')
    sessionStorage.removeItem('view_as_client_name')
    if (clientId) {
      router.push(`/clients/${clientId}`)
    } else {
      router.push('/clients')
    }
  }

  const isActivePath = (path: string) => {
    if (
      path === '/client-portal/dashboard' &&
      pathname === '/client-portal/dashboard'
    )
      return true
    if (path !== '/client-portal/dashboard' && pathname.startsWith(path))
      return true
    return false
  }

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

  if (!isAuthenticated) return null

  return (
    <>
      {impersonatedClientName && (
        <div className="bg-amber-token text-ink-on-dark px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-3 sticky top-0 z-[60]">
          <Eye className="h-4 w-4 shrink-0" />
          <span>Viewing portal as: {impersonatedClientName}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={exitClientImpersonation}
            className="h-7 text-xs"
          >
            Exit Preview
          </Button>
        </div>
      )}
      <header className="bg-surface-1 border-b border-line sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => router.push('/client-portal/dashboard')}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/novus-global-logo.webp"
                    alt=""
                    width={28}
                    height={28}
                    className="object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-[16px] font-bold tracking-tight text-ink leading-none">
                    Coach Sidekick
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3 leading-none">
                    Client portal
                  </span>
                </div>
              </button>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map(item => {
                  const Icon = item.icon
                  const isActive = isActivePath(item.path)

                  return (
                    <button
                      key={item.path}
                      onClick={() => router.push(item.path)}
                      className={`
                        inline-flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium
                        transition-colors duration-150 cursor-pointer
                        ${
                          isActive
                            ? 'bg-surface-3 text-ink'
                            : 'text-ink-3 hover:bg-surface-3 hover:text-ink'
                        }
                      `}
                    >
                      <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} />
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <button
                aria-label="Notifications"
                className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-3 hover:bg-surface-3 hover:text-ink transition-colors"
              >
                <Bell className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button
                aria-label="Search"
                className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-3 hover:bg-surface-3 hover:text-ink transition-colors"
              >
                <Search className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <div className="hidden sm:block w-px h-5 bg-line" />

              <ThemeToggle />

              {/* Role Switcher - Only show if user has other roles */}
              {hasOtherRoles && <RoleSwitcher />}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full p-0 hover:bg-transparent"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-ink text-ink-on-dark text-xs font-semibold">
                        {getInitials()}
                      </AvatarFallback>
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
                    onSelect={() => router.push('/client-portal/profile')}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={handleSignOut}
                    className="cursor-pointer text-vermillion"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-line ">
              <nav className="flex flex-col gap-1">
                {navItems.map(item => {
                  const Icon = item.icon
                  const isActive = isActivePath(item.path)

                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        router.push(item.path)
                        setMobileMenuOpen(false)
                      }}
                      className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-surface-3 text-ink '
                          : 'text-ink-3 hover:text-ink hover:bg-paper '
                      }
                    `}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  )
}
