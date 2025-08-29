'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { UserNav } from '@/components/auth/user-nav'
import { BarChart3, UserCheck, History, Sparkles } from 'lucide-react'
import Image from 'next/image'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()

  const isActivePath = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/clients', label: 'Clients', icon: UserCheck },
    { path: '/sessions', label: 'Sessions', icon: History },
  ]

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
                    Novus GLobal Powered AI
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
                        transition-all duration-200
                        ${
                          isActive
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
            )}

            <UserNav />
          </div>

          {/* Mobile Navigation Toggle - could be added if needed */}
        </div>
      </div>
    </header>
  )
}
