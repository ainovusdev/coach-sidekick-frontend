'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Edit,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Commitment } from '@/types/commitment'
import { CommitmentForm } from './commitment-form'
import { toast } from '@/hooks/use-toast'
import { CommitmentService } from '@/services/commitment-service'

interface CommitmentCompactItemProps {
  commitment: Commitment
  onUpdate?: () => void
}

export function CommitmentCompactItem({
  commitment,
  onUpdate,
}: CommitmentCompactItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const daysUntilDeadline = commitment.days_until_deadline
  const isOverdue = daysUntilDeadline && daysUntilDeadline < 0
  const isDueSoon =
    daysUntilDeadline && daysUntilDeadline >= 0 && daysUntilDeadline <= 7

  const handleEdit = async (data: any) => {
    try {
      await CommitmentService.updateCommitment(commitment.id, data)
      toast({
        title: 'Commitment Updated',
        description: 'The commitment has been updated successfully.',
      })
      setIsEditing(false)
      onUpdate?.()
    } catch (error) {
      console.error('Failed to update commitment:', error)
    }
  }

  return (
    <>
      <div className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
        {/* Collapsed View */}
        <div
          className="p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100"
                onClick={e => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-black truncate">
                    {commitment.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs shrink-0',
                      commitment.type === 'action' &&
                        'bg-blue-50 border-blue-200 text-blue-700',
                      commitment.type === 'habit' &&
                        'bg-purple-50 border-purple-200 text-purple-700',
                      commitment.type === 'milestone' &&
                        'bg-orange-50 border-orange-200 text-orange-700',
                      commitment.type === 'learning' &&
                        'bg-green-50 border-green-200 text-green-700',
                    )}
                  >
                    {commitment.type}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <Progress
                    value={commitment.progress_percentage}
                    className="h-1.5 flex-1"
                  />
                  <span className="text-xs text-gray-500 shrink-0">
                    {commitment.progress_percentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right side info */}
            <div className="flex items-center gap-2 shrink-0">
              {commitment.target_date && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    isOverdue && 'text-red-600',
                    isDueSoon && 'text-orange-600',
                    !isOverdue && !isDueSoon && 'text-gray-500',
                  )}
                  onClick={e => e.stopPropagation()}
                >
                  {isOverdue ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">
                    {isOverdue
                      ? `${Math.abs(daysUntilDeadline!)}d overdue`
                      : isDueSoon
                        ? `${daysUntilDeadline}d left`
                        : new Date(commitment.target_date).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                            },
                          )}
                  </span>
                </div>
              )}

              {commitment.progress_percentage >= 100 && (
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  Complete
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
            {/* Description */}
            {commitment.description && (
              <div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {commitment.description}
                </p>
              </div>
            )}

            {/* Additional Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Status */}
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">Status:</span>
                <Badge variant="outline" className="text-xs">
                  {commitment.status}
                </Badge>
              </div>

              {/* Priority */}
              {commitment.priority && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Priority:</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      commitment.priority === 'urgent' &&
                        'bg-red-50 border-red-200 text-red-700',
                      commitment.priority === 'high' &&
                        'bg-orange-50 border-orange-200 text-orange-700',
                      commitment.priority === 'medium' &&
                        'bg-yellow-50 border-yellow-200 text-yellow-700',
                      commitment.priority === 'low' &&
                        'bg-gray-50 border-gray-200 text-gray-700',
                    )}
                  >
                    {commitment.priority}
                  </Badge>
                </div>
              )}

              {/* Measurement Criteria */}
              {commitment.measurement_criteria && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">
                    Success Criteria:
                  </p>
                  <p className="text-sm text-gray-700">
                    {commitment.measurement_criteria}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={e => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
                className="border-gray-300 hover:bg-gray-50 hover:border-black"
              >
                <Edit className="h-3 w-3 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <CommitmentForm
        open={isEditing}
        onOpenChange={setIsEditing}
        onSubmit={handleEdit}
        commitment={commitment}
        clientId={commitment.client_id}
        sessionId={commitment.session_id || undefined}
      />
    </>
  )
}
