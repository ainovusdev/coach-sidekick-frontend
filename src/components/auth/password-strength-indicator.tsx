'use client'

import { CheckCircle } from 'lucide-react'
import {
  PasswordStrength,
  PASSWORD_REQUIREMENTS,
  getStrengthLabel,
  getStrengthColor,
  getStrengthBarColor,
} from '@/lib/password-validation'

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength
  score: number
  showRequirements?: boolean
  compact?: boolean
}

export function PasswordStrengthIndicator({
  strength,
  score,
  showRequirements = true,
  compact = false,
}: PasswordStrengthIndicatorProps) {
  const strengthLabel = getStrengthLabel(score)
  const strengthColor = getStrengthColor(score)
  const barColor = getStrengthBarColor(score)

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Strength bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${barColor}`}
              style={{ width: `${(score / 5) * 100}%` }}
            />
          </div>
          {strengthLabel && (
            <span className={`text-xs font-medium ${strengthColor}`}>
              {strengthLabel}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      {/* Strength bar with label */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">
            Password Strength
          </span>
          {strengthLabel && (
            <span className={`text-xs font-medium ${strengthColor}`}>
              {strengthLabel}
            </span>
          )}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements list */}
      {showRequirements && (
        <div className="space-y-1.5 pt-1">
          {PASSWORD_REQUIREMENTS.map(({ key, label }) => {
            const met = strength[key as keyof PasswordStrength]
            return (
              <div
                key={key}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  met ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {met ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-current flex-shrink-0" />
                )}
                <span className="text-xs">{label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
