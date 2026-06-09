'use client'

import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/date-utils'
import { CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

interface QuestionnaireCompleteProps {
  clientName: string
  coachName: string
  scheduledFor: string | null
  kind?: 'pre_session' | 'post_session'
}

export function QuestionnaireComplete({
  clientName,
  coachName,
  scheduledFor,
  kind = 'pre_session',
}: QuestionnaireCompleteProps) {
  const [showCheck, setShowCheck] = useState(false)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowCheck(true), 200)
    const t2 = setTimeout(() => setShowText(true), 600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  const dateInfo =
    kind === 'pre_session' && scheduledFor
      ? formatDate(scheduledFor, "EEEE, MMMM d 'at' h:mm a")
      : null
  const isThrillForm = kind === 'post_session'

  return (
    <div className="min-h-screen flex flex-col  ">
      {/* Logo */}
      <div className="pt-8 px-6 flex justify-center">
        <Image
          src="/novus-global-logo.webp"
          alt="Novus Global"
          width={120}
          height={40}
          className="opacity-80"
          priority
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          {/* Animated Checkmark */}
          <div
            className={`transition-all duration-500 ease-out ${
              showCheck ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
          >
            <div className="w-20 h-20 bg-ink rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="h-10 w-10 text-ink-on-dark" />
            </div>
          </div>

          {/* Text */}
          <div
            className={`transition-all duration-500 ease-out delay-200 ${
              showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h1 className="text-3xl font-light text-ink mb-4">
              Thank you, {clientName}!
            </h1>
            <p className="text-ink-3 text-lg leading-relaxed mb-6">
              {isThrillForm
                ? `Your Thrill Form has been shared with ${coachName}.`
                : `Your responses have been shared with ${coachName}.`}
              {dateInfo && (
                <>
                  <br />
                  <span className="text-ink-4">See you on {dateInfo}.</span>
                </>
              )}
            </p>
            <p className="text-sm text-ink-2">You can close this tab now.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center">
        <p className="text-xs text-ink-2">Powered by Novus Global</p>
      </div>
    </div>
  )
}
