'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { TargetService } from '@/services/target-service'
import { Link2, Plus, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Target {
  id: string
  title: string
  status: string
  progress_percentage: number
}

interface CommitmentTargetSelectorProps {
  linkedTargetIds: string[]
  suggestedTargetIndices: number[]
  extractedTargets: any[]
  currentSprintId: string | null
  onChange: (targetIds: string[], indices: number[]) => void
}

export function CommitmentTargetSelector({
  linkedTargetIds,
  suggestedTargetIndices,
  extractedTargets,
  currentSprintId,
  onChange,
}: CommitmentTargetSelectorProps) {
  const [existingTargets, setExistingTargets] = useState<Target[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchTargets = async () => {
      if (!currentSprintId) return

      setLoading(true)
      try {
        const targets = await TargetService.listTargets({
          sprint_id: currentSprintId,
          status: 'active',
        })
        setExistingTargets(targets || [])
      } catch (error) {
        console.error('Failed to fetch targets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTargets()
  }, [currentSprintId])

  const handleAddExistingTarget = (targetId: string) => {
    if (!linkedTargetIds.includes(targetId)) {
      onChange([...linkedTargetIds, targetId], suggestedTargetIndices)
    }
  }

  const handleAddExtractedTarget = (index: number) => {
    if (!suggestedTargetIndices.includes(index)) {
      onChange(linkedTargetIds, [...suggestedTargetIndices, index])
    }
  }

  const handleRemoveExistingTarget = (targetId: string) => {
    onChange(
      linkedTargetIds.filter(id => id !== targetId),
      suggestedTargetIndices,
    )
  }

  const handleRemoveExtractedTarget = (index: number) => {
    onChange(
      linkedTargetIds,
      suggestedTargetIndices.filter(i => i !== index),
    )
  }

  const totalLinked =
    (linkedTargetIds?.length || 0) + (suggestedTargetIndices?.length || 0)

  return (
    <div className="space-y-2">
      {/* Selected Targets */}
      {totalLinked > 0 && (
        <div className="flex flex-wrap gap-1">
          {/* Existing targets */}
          {linkedTargetIds.map(targetId => {
            const target = existingTargets.find(t => t.id === targetId)
            return (
              <Badge
                key={targetId}
                variant="secondary"
                className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1 pr-1"
              >
                <Link2 className="h-3 w-3" />
                <span className="text-xs">
                  {target?.title || 'Unknown Target'}
                </span>
                <button
                  onClick={() => handleRemoveExistingTarget(targetId)}
                  className="ml-1 hover:bg-blue-200 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}

          {/* Extracted targets */}
          {suggestedTargetIndices.map(index => {
            const target = extractedTargets[index]
            return (
              <Badge
                key={index}
                variant="secondary"
                className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1 pr-1"
              >
                <Link2 className="h-3 w-3" />
                <span className="text-xs">
                  {target?.title || `Target ${index + 1}`}
                </span>
                <button
                  onClick={() => handleRemoveExtractedTarget(index)}
                  className="ml-1 hover:bg-green-200 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Add Target Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            {totalLinked > 0 ? 'Add More Desired Wins' : 'Link to Desired Win'}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {/* Extracted Targets */}
          {extractedTargets.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-gray-500">
                From This Extraction
              </DropdownMenuLabel>
              {extractedTargets.map((target, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => handleAddExtractedTarget(index)}
                  disabled={suggestedTargetIndices.includes(index)}
                  className={cn(
                    'text-sm',
                    suggestedTargetIndices.includes(index) &&
                      'opacity-50 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 text-xs"
                    >
                      New
                    </Badge>
                    <span className="flex-1 truncate">{target.title}</span>
                    {suggestedTargetIndices.includes(index) && (
                      <span className="text-xs text-gray-400">Linked</span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Existing Active Targets */}
          {existingTargets.length > 0 ? (
            <>
              <DropdownMenuLabel className="text-xs text-gray-500">
                Existing Sprint Desired Wins
              </DropdownMenuLabel>
              {existingTargets.map(target => (
                <DropdownMenuItem
                  key={target.id}
                  onClick={() => handleAddExistingTarget(target.id)}
                  disabled={linkedTargetIds.includes(target.id)}
                  className={cn(
                    'text-sm',
                    linkedTargetIds.includes(target.id) &&
                      'opacity-50 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        target.status === 'completed'
                          ? 'bg-green-500'
                          : 'bg-gray-400',
                      )}
                    />
                    <span className="flex-1 truncate">{target.title}</span>
                    <span className="text-xs text-gray-400">
                      {target.progress_percentage}%
                    </span>
                    {linkedTargetIds.includes(target.id) && (
                      <span className="text-xs text-gray-400">Linked</span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          ) : (
            !loading && (
              <div className="p-3 text-xs text-gray-500 text-center">
                {currentSprintId
                  ? 'No existing desired wins in current sprint'
                  : 'No active sprint found'}
              </div>
            )
          )}

          {loading && (
            <div className="p-3 text-xs text-gray-500 text-center">
              Loading desired wins...
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {totalLinked === 0 && (
        <p className="text-xs text-gray-500">No desired wins linked yet</p>
      )}
    </div>
  )
}
