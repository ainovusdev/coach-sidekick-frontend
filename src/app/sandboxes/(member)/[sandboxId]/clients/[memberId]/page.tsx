'use client'

import { useParams } from 'next/navigation'
import { SandboxDetailPage } from '@/components/sandboxes/details/detail-page'

export default function Page() {
  const params = useParams<{ sandboxId: string; memberId: string }>()
  return (
    <SandboxDetailPage
      sandboxId={params.sandboxId}
      kind="client"
      entityId={params.memberId}
    />
  )
}
