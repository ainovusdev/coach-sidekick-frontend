/**
 * Meeting Ended Overlay
 * Shows when the meeting has ended
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ExternalLink, FileText, Target } from 'lucide-react'
import Link from 'next/link'

interface MeetingEndedOverlayProps {
  coachName: string | null
  notesCount: number
  commitmentsCount: number
}

export function MeetingEndedOverlay({
  coachName,
  notesCount,
  commitmentsCount,
}: MeetingEndedOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-gray-200 dark:border-gray-700 shadow-2xl dark:bg-gray-800">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Session Complete
          </h2>

          {/* Subtitle */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {coachName
              ? `Your session with ${coachName} has ended.`
              : 'This coaching session has ended.'}
          </p>

          {/* Summary Stats */}
          {(notesCount > 0 || commitmentsCount > 0) && (
            <div className="flex justify-center gap-6 mb-6 py-4 border-y border-gray-100 dark:border-gray-700">
              {notesCount > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <FileText className="h-4 w-4" />
                    <span className="text-2xl font-bold">{notesCount}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {notesCount === 1 ? 'Note' : 'Notes'} saved
                  </p>
                </div>
              )}
              {notesCount > 0 && commitmentsCount > 0 && (
                <div className="w-px bg-gray-200 dark:bg-gray-700" />
              )}
              {commitmentsCount > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <Target className="h-4 w-4" />
                    <span className="text-2xl font-bold">
                      {commitmentsCount}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {commitmentsCount === 1 ? 'Commitment' : 'Commitments'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Message */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Your notes and commitments have been saved. You can access them
            anytime by signing up for the client portal.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href="/client-portal/auth/signup" className="w-full">
              <Button className="w-full">
                Sign up for Client Portal
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="text-gray-500 dark:text-gray-400"
              onClick={() => window.close()}
            >
              Close this page
            </Button>
          </div>

          {/* Note */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Already have an account?{' '}
            <Link
              href="/client-portal/auth/signup"
              className="text-gray-600 dark:text-gray-300 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
