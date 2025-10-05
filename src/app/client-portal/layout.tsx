'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Calendar, User, LogOut, BarChart, Target } from 'lucide-react'

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Don't show navigation on auth pages
  const isAuthPage = pathname?.includes('/auth')

  if (isAuthPage) {
    return <>{children}</>
  }

  const navigation = [
    { name: 'Dashboard', href: '/client-portal/dashboard', icon: Home },
    { name: 'Sessions', href: '/client-portal/sessions', icon: Calendar },
    { name: 'Progress', href: '/client-portal/progress', icon: BarChart },
    { name: 'Action Items', href: '/client-portal/action-items', icon: Target },
    { name: 'Profile', href: '/client-portal/profile', icon: User },
  ]

  const handleLogout = () => {
    localStorage.removeItem('client_auth_token')
    window.location.href = '/client-portal/auth/login'
  }

  return (
    <div className="min-h-screen flex bg-black">
      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-black via-zinc-950 to-black border-r border-zinc-800 flex flex-col">
        {/* Logo Section */}
        <div className="p-8 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Coach Sidekick
          </h2>
          <p className="text-zinc-400 text-sm font-medium">Client Portal</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`group flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-black shadow-lg shadow-white/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${isActive ? 'text-black' : 'text-zinc-400 group-hover:text-white'}`}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-zinc-800">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-zinc-950">
        <main className="p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  )
}
