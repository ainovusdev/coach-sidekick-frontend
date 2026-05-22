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
    <div className="min-h-screen bg-surface-2">
      <Navigation />
      <main className={className}>{children}</main>
    </div>
  )
}
