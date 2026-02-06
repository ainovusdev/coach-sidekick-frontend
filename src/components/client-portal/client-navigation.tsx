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
  LayoutDashboard,
  History,
  Target,
  CheckSquare,
  User,
  LogOut,
  Sparkles,
  Menu,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { RoleSwitcher } from '@/components/auth/role-switcher'

const navItems = [
  {
    path: '/client-portal/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  { path: '/client-portal/sessions', label: 'Sessions', icon: History },
  { path: '/client-portal/outcomes', label: 'Outcomes', icon: Target },
  {
    path: '/client-portal/my-commitments',
    label: 'Commitments',
    icon: CheckSquare,
  },
  { path: '/client-portal/persona', label: 'My Profile', icon: User },
]

export function ClientNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, signOut, user, roles } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check if user has other roles besides client
  const hasOtherRoles = roles.some(role => role !== 'client')

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
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-10">
            <button
              onClick={() => router.push('/client-portal/dashboard')}
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
                    Client Portal
                  </h1>
                </div>
                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                  <Sparkles className="w-3 h-3 text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">
                    Novus Global
                  </span>
                </div>
              </div>
            </button>

            {/* Desktop Navigation Links */}
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
            {/* Role Switcher - Only show if user has other roles */}
            {hasOtherRoles && <RoleSwitcher />}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
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
                  className="cursor-pointer text-red-600"
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
          <div className="md:hidden py-4 border-t border-gray-100">
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
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
  )
}
