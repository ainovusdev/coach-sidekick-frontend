'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Sparkles } from 'lucide-react'
import { Commitment } from '@/types/commitment'
import { CommitmentForm } from './commitment-form'
import { useUpdateCommitment } from '@/hooks/mutations/use-commitment-mutations'

interface CommitmentListItemProps {
  commitment: Commitment
  onUpdate?: () => void
}

export function CommitmentListItem({
  commitment,
  onUpdate,
}: CommitmentListItemProps) {
  const [showEdit, setShowEdit] = useState(false)
  const updateCommitment = useUpdateCommitment()

  const handleUpdate = async (data: any) => {
    await updateCommitment.mutateAsync({
      commitmentId: commitment.id,
      data,
    })
    setShowEdit(false)
    onUpdate?.()
  }

  return (
    <>
      <Card className="border-gray-200 hover:border-blue-200 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h5 className="font-medium text-gray-900 mb-1">
                {commitment.title}
              </h5>
              {commitment.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {commitment.description}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{commitment.type}</Badge>
                <Badge
                  variant="secondary"
                  className={
                    commitment.priority === 'high' ||
                    commitment.priority === 'urgent'
                      ? 'bg-red-100 text-red-700'
                      : commitment.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                  }
                >
                  {commitment.priority}
                </Badge>
                {commitment.target_date && (
                  <Badge variant="outline" className="text-xs">
                    Due: {new Date(commitment.target_date).toLocaleDateString()}
                  </Badge>
                )}
                {commitment.progress_percentage > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    {commitment.progress_percentage}% complete
                  </Badge>
                )}
                {commitment.extracted_from_transcript && (
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-700"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Extracted
                  </Badge>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEdit(true)}
              className="flex-shrink-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <CommitmentForm
        open={showEdit}
        onOpenChange={setShowEdit}
        onSubmit={handleUpdate}
        commitment={commitment}
        clientId={commitment.client_id}
        sessionId={commitment.session_id}
      />
    </>
  )
}
