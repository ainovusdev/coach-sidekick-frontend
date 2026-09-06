'use client'

import { Suspense } from 'react'
import PageLayout from '@/components/layout/page-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { CommitmentsHub } from '@/components/commitments/hub/commitments-hub'
import { CommitmentsSkeleton } from '@/components/commitments/hub/commitments-skeleton'

/** Coach chrome mount of the commitments hub. */
export default function CommitmentsPage() {
  return (
    <ProtectedRoute loadingMessage="Loading commitments...">
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense fallback={<CommitmentsSkeleton />}>
            <CommitmentsHub audience="coach" />
          </Suspense>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
