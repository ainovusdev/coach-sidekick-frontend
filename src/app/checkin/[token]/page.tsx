'use client'

/**
 * Public weekly commitment check-in, reached from the Monday digest email.
 * Thin route shell: owns the token and the state machine, delegates everything
 * else. All page state lives in `useCheckin`.
 */

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { useCheckin } from './hooks/use-checkin'
import { CheckinScreen } from './components/checkin-screen'
import {
  CheckinSkeleton,
  ExpiredScreen,
  LoadFailedScreen,
} from './components/checkin-states'

export default function CheckinPage() {
  const params = useParams()
  const token = params.token as string
  const checkin = useCheckin(token)

  if (checkin.status === 'loading') return <CheckinSkeleton />
  if (checkin.status === 'expired') return <ExpiredScreen />
  if (checkin.status === 'failed') {
    return (
      <LoadFailedScreen
        onRetry={checkin.retryLoad}
        attempts={checkin.attempts}
      />
    )
  }
  if (!checkin.data) return null

  // CheckinScreen reads `?commitment=` for the email's deep link, so it needs a
  // Suspense boundary around useSearchParams.
  return (
    <Suspense fallback={<CheckinSkeleton />}>
      <CheckinScreen data={checkin.data} checkin={checkin} />
    </Suspense>
  )
}
