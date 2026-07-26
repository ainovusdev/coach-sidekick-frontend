'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import {
  CheckinService,
  CheckinPage as CheckinPageData,
} from '@/services/checkin-service'
import { CheckinList } from './components/checkin-list'

type PageState = 'loading' | 'error' | 'active'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-ink-4 mx-auto mb-4" />
        <p className="text-ink-3 text-sm">Loading your commitments...</p>
      </div>
    </div>
  )
}

export default function CheckinPage() {
  const params = useParams()
  const token = params.token as string

  const [state, setState] = useState<PageState>('loading')
  const [data, setData] = useState<CheckinPageData | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await CheckinService.getCheckin(token)
        setData(result)
        setState('active')
      } catch {
        setState('error')
      }
    }
    load()
  }, [token])

  if (state === 'loading') {
    return <LoadingScreen />
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-surface-3 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-ink-4" />
          </div>
          <h1 className="text-xl font-semibold text-ink mb-3">
            Check-in Unavailable
          </h1>
          <p className="text-ink-3 leading-relaxed">
            This check-in link is invalid or has expired. Ask your coach for a
            fresh one — a new link arrives with every weekly summary.
          </p>
        </div>
      </div>
    )
  }

  if (state === 'active' && data) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <CheckinList token={token} data={data} />
      </Suspense>
    )
  }

  return null
}
