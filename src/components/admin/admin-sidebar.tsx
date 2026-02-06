'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Users2,
  UserCheck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Settings,
  FileText,
  Network,
  FolderKanban,
  BookOpen,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    requiredRole: ['admin', 'super_admin'],
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    requiredRole: ['admin', 'super_admin'],
  },
  {
    title: 'Sandboxes',
    href: '/admin/programs',
    icon: FolderKanban,
    requiredRole: ['super_admin'],
  },
  {
    title: 'Clients',
    href: '/admin/clients',
    icon: Users2,
    requiredRole: ['super_admin'],
  },
  {
    title: 'Knowledge Hub',
    href: '/admin/knowledge',
    icon: BookOpen,
    requiredRole: ['admin', 'super_admin'],
  },
  {
    title: 'Access Management',
    href: '/admin/access',
    icon: Network,
    requiredRole: ['admin', 'super_admin'],
  },
  {
    title: 'Roles',
    href: '/admin/roles',
    icon: Shield,
    requiredRole: ['super_admin'],
  },
  {
    title: 'Audit Log',
    href: '/admin/audit-log',
    icon: FileText,
    requiredRole: ['super_admin'],
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    requiredRole: ['super_admin'],
  },
]

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { hasAnyRole } = useAuth()

  const filteredMenuItems = menuItems.filter(item =>
    hasAnyRole(item.requiredRole),
  )

  return (
    <div
      className={cn(
        'bg-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div
          className={cn(
            'flex items-center gap-2',
            collapsed && 'justify-center',
          )}
        >
          <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-gray-900" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold">Admin Panel</h2>
              <p className="text-xs text-gray-400">Coach Sidekick</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {filteredMenuItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                    'hover:bg-gray-800',
                    isActive && 'bg-gray-800 border-l-4 border-white',
                    collapsed && 'justify-center',
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.title}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
