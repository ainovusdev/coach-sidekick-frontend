'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { UserNav } from '@/components/auth/user-nav'
import { Brain, BarChart3, UserCheck, History } from 'lucide-react'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const isActivePath = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  const getNavButtonClass = (path: string) => {
    const baseClass = 'font-medium transition-all duration-200'
    if (isActivePath(path)) {
      return `${baseClass} bg-blue-50 text-blue-700 hover:bg-blue-100`
    }
    return `${baseClass} text-slate-600 hover:text-blue-700 hover:bg-blue-50`
  }

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-4">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Coach Sidekick
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  AI-Powered Coaching Dashboard
                </p>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className={getNavButtonClass('/')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/clients')}
                className={getNavButtonClass('/clients')}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Clients
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/sessions')}
                className={getNavButtonClass('/sessions')}
              >
                <History className="h-4 w-4 mr-2" />
                Sessions
              </Button>
            </nav>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">
                  Welcome back, {user?.email?.split('@')[0]}
                </span>
              </div>
            </div>
            <UserNav />
          </div>
        </div>
      </div>
    </div>
  )
}
