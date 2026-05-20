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
    <div className="min-h-screen  ">
      <ClientNavigation />
      <main className={`${className}`}>{children}</main>
    </div>
  )
}
