'use client'

import { ReactNode } from 'react'
import Navigation from '@/components/layout/navigation'

interface PageLayoutProps {
  children: ReactNode
  className?: string
}

export default function PageLayout({
  children,
  className = '',
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Navigation />
      <main className={`${className}`}>{children}</main>
    </div>
  )
}
