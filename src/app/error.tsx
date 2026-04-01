'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-app-primary mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-app-secondary mb-6 leading-relaxed">
          We hit an unexpected error loading this page. This has been noted and
          we&apos;re looking into it. Please try again or head back to the
          dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="default" size="sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="outline"
            size="sm"
          >
            <Home className="h-3.5 w-3.5 mr-1.5" />
            Dashboard
          </Button>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-app-secondary/60">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
