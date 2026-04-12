'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

interface QuestionnaireCompleteProps {
  clientName: string
  coachName: string
  scheduledFor: string | null
}

export function QuestionnaireComplete({
  clientName,
  coachName,
  scheduledFor,
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

  const dateInfo = scheduledFor
    ? format(new Date(scheduledFor), "EEEE, MMMM d 'at' h:mm a")
    : null

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-100">
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
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Text */}
          <div
            className={`transition-all duration-500 ease-out delay-200 ${
              showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h1 className="text-3xl font-light text-gray-900 mb-4">
              Thank you, {clientName}!
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-6">
              Your responses have been shared with {coachName}.
              {dateInfo && (
                <>
                  <br />
                  <span className="text-gray-400">See you on {dateInfo}.</span>
                </>
              )}
            </p>
            <p className="text-sm text-gray-300">You can close this tab now.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center">
        <p className="text-xs text-gray-300">Powered by Novus Global</p>
      </div>
    </div>
  )
}
