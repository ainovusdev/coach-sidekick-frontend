'use client'

import React, { useState } from 'react'
import { CommitmentCard } from './commitment-card'
import {
  Commitment,
  CommitmentStatus,
  CommitmentType,
} from '@/types/commitment'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommitmentListProps {
  commitments: Commitment[]
  onEdit?: (commitment: Commitment) => void
  onDelete?: (commitmentId: string) => void
  onUpdateProgress?: (commitment: Commitment) => void
  compact?: boolean
  showFilters?: boolean
  className?: string
}

export function CommitmentList({
  commitments,
  onEdit,
  onDelete,
  onUpdateProgress,
  compact = false,
  showFilters = true,
  className,
}: CommitmentListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CommitmentStatus | 'all'>(
    'all',
  )
  const [typeFilter, setTypeFilter] = useState<CommitmentType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'created'>(
    'deadline',
  )
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // Filter commitments
  const filteredCommitments = commitments.filter(commitment => {
    const matchesSearch =
      commitment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commitment.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || commitment.status === statusFilter
    const matchesType = typeFilter === 'all' || commitment.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Sort commitments
  const sortedCommitments = [...filteredCommitments].sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        if (!a.target_date && !b.target_date) return 0
        if (!a.target_date) return 1
        if (!b.target_date) return -1
        return (
          new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
        )
      case 'progress':
        return b.progress_percentage - a.progress_percentage
      case 'created':
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      default:
        return 0
    }
  })

  if (commitments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-2">No commitments yet</div>
        <p className="text-sm text-muted-foreground">
          Create your first commitment to get started
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search commitments..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <SlidersHorizontal className="size-4" />
            </Button>
          </div>

          {showFilterPanel && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-accent/50">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={value =>
                    setStatusFilter(value as CommitmentStatus | 'all')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={typeFilter}
                  onValueChange={value =>
                    setTypeFilter(value as CommitmentType | 'all')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="habit">Habit</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={sortBy}
                  onValueChange={value => setSortBy(value as typeof sortBy)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="created">Recently Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedCommitments.length} of {commitments.length} commitments
      </div>

      {/* Commitment Cards */}
      <div className={cn('space-y-4', compact && 'space-y-2')}>
        {sortedCommitments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No commitments match your filters
          </div>
        ) : (
          sortedCommitments.map(commitment => (
            <CommitmentCard
              key={commitment.id}
              commitment={commitment}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateProgress={onUpdateProgress}
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  )
}
