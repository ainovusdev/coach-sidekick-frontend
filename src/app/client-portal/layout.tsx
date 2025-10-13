'use client'

import { usePathname } from 'next/navigation'
import { ClientRoute } from '@/components/auth/client-route'
import { ClientPageLayout } from '@/components/client/client-page-layout'

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

  return (
    <ClientRoute>
      <ClientPageLayout>{children}</ClientPageLayout>
    </ClientRoute>
  )
}
