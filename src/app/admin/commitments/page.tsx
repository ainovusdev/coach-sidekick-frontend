'use client'

import { Suspense } from 'react'
import { CommitmentsHub } from '@/components/commitments/hub/commitments-hub'
import { CommitmentsSkeleton } from '@/components/commitments/hub/commitments-skeleton'

/** Admin chrome mount of the commitments hub (layout adds sidebar + header). */
export default function AdminCommitmentsPage() {
  return (
    <Suspense fallback={<CommitmentsSkeleton />}>
      <CommitmentsHub audience="admin" />
    </Suspense>
  )
}
