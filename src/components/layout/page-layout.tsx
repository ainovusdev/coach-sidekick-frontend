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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation />
      <main className={`${className}`}>{children}</main>
    </div>
  )
}
