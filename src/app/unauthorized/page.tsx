'use client'

import { useRouter } from 'next/navigation'
import { ShieldOff } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default function UnauthorizedPage() {
  const router = useRouter()
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <EmptyState
        icon={ShieldOff}
        title="You don't have access to this page"
        description="Your account isn't allowed here. If that seems wrong, ask whoever set you up."
        action={{ label: 'Go home', onClick: () => router.push('/') }}
      />
    </div>
  )
}
