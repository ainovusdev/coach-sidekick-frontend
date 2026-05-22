/**
 * Meeting Ended Overlay
 * Shows when the meeting has ended
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  ExternalLink,
  FileText,
  Target,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

interface MeetingEndedOverlayProps {
  coachName: string | null
  notesCount: number
  commitmentsCount: number
  thrillFormToken?: string | null
}

export function MeetingEndedOverlay({
  coachName,
  notesCount,
  commitmentsCount,
  thrillFormToken,
}: MeetingEndedOverlayProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('client_auth_token')
    setIsLoggedIn(!!token)
  }, [])

  return (
    <div className="fixed inset-0 bg-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-line shadow-2xl ">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-forest-bg rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-forest " />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-ink mb-2">Session Complete</h2>

          {/* Subtitle */}
          <p className="text-ink-3 mb-6">
            {coachName
              ? `Your session with ${coachName} has ended.`
              : 'This coaching session has ended.'}
          </p>

          {/* Summary Stats */}
          {(notesCount > 0 || commitmentsCount > 0) && (
            <div className="flex justify-center gap-6 mb-6 py-4 border-y border-line ">
              {notesCount > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-ink-2 ">
                    <FileText className="h-4 w-4" />
                    <span className="text-2xl font-bold">{notesCount}</span>
                  </div>
                  <p className="text-xs text-ink-3 mt-1">
                    {notesCount === 1 ? 'Note' : 'Notes'} saved
                  </p>
                </div>
              )}
              {notesCount > 0 && commitmentsCount > 0 && (
                <div className="w-px bg-surface-3 " />
              )}
              {commitmentsCount > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-ink-2 ">
                    <Target className="h-4 w-4" />
                    <span className="text-2xl font-bold">
                      {commitmentsCount}
                    </span>
                  </div>
                  <p className="text-xs text-ink-3 mt-1">
                    {commitmentsCount === 1 ? 'Commitment' : 'Commitments'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Thrill Form CTA — shown above all other actions when available.
              The form auto-opens in a new tab on session end; this button is
              the always-available fallback for popup-blocked browsers. */}
          {thrillFormToken && (
            <div className="mb-6">
              <a
                href={`/questionnaire/${thrillFormToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full" size="lg">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Open Thrill Form
                </Button>
              </a>
              <p className="text-xs text-ink-4 mt-2">
                We&apos;ve also emailed you the link.
              </p>
            </div>
          )}

          {/* Message & Actions - different for logged in vs guest */}
          {isLoggedIn ? (
            <>
              <p className="text-sm text-ink-3 mb-6">
                Your notes and commitments have been saved. You can review them
                in your dashboard.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/client-portal/dashboard" className="w-full">
                  <Button className="w-full">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="text-ink-3 "
                  onClick={() => window.close()}
                >
                  Close this page
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-3 mb-6">
                Your notes and commitments have been saved. You can access them
                anytime by signing up for the client portal.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/client-portal/auth/signup" className="w-full">
                  <Button className="w-full">
                    Sign up for Client Portal
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="text-ink-3 "
                  onClick={() => window.close()}
                >
                  Close this page
                </Button>
              </div>
              <p className="text-xs text-ink-4 mt-4">
                Already have an account?{' '}
                <Link
                  href="/client-portal/auth/signup"
                  className="text-ink-3 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
