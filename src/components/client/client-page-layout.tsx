'use client'

import { ReactNode } from 'react'
import { ClientNavigation } from '@/components/client-portal/client-navigation'

interface ClientPageLayoutProps {
  children: ReactNode
  className?: string
}

export function ClientPageLayout({
  children,
  className = '',
}: ClientPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <ClientNavigation />
      <main className={`${className}`}>{children}</main>
    </div>
  )
}
