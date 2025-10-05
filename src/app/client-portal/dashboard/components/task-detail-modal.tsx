'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Task,
  TaskComment,
  clientDashboardAPI,
} from '@/services/client-dashboard-api'
import {
  Calendar,
  Clock,
  MessageSquare,
  Send,
  User,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onTaskUpdate?: (task: Task) => void
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onTaskUpdate,
}: TaskDetailModalProps) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSendingComment, setIsSendingComment] = useState(false)

  useEffect(() => {
    if (task && isOpen) {
      fetchComments()
    }
  }, [task, isOpen])

  const fetchComments = async () => {
    if (!task) return

    setIsLoadingComments(true)
    try {
      const fetchedComments = await clientDashboardAPI.getTaskComments(task.id)
      setComments(fetchedComments)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleSendComment = async () => {
    if (!task || !newComment.trim()) return

    setIsSendingComment(true)
    try {
      const comment = await clientDashboardAPI.addTaskComment(
        task.id,
        newComment.trim(),
      )
      setComments(prev => [...prev, comment])
      setNewComment('')

      // Update task comment count
      if (onTaskUpdate) {
        onTaskUpdate({
          ...task,
          comment_count: (task.comment_count || 0) + 1,
        })
      }
    } catch (error) {
      console.error('Failed to send comment:', error)
    } finally {
      setIsSendingComment(false)
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return null
    }
  }

  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <DialogTitle className="text-xl pr-4">{task.title}</DialogTitle>
              <div className="flex gap-2">
                {getStatusBadge(task.status)}
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </div>
            </div>

            {/* Task metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                </div>
              )}
              {task.assignor_name && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Assigned by: {task.assignor_name}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Created: {format(new Date(task.created_at), 'MMM d, yyyy')}
              </div>
            </div>

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        {/* Description */}
        {task.description && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Description</h3>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>
        )}

        {/* Comments Section */}
        <div className="flex-1 space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </h3>
          </div>

          {/* Comments List */}
          <ScrollArea className="flex-1 max-h-[300px]">
            {isLoadingComments ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {comment.user_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {comment.user_role} •{' '}
                            {format(
                              new Date(comment.created_at),
                              'MMM d, h:mm a',
                            )}
                          </p>
                        </div>
                      </div>
                      {comment.is_edited && (
                        <Badge variant="outline" className="text-xs">
                          edited
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 ml-10">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* New Comment Input */}
          <div className="space-y-2 border-t pt-4">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="resize-none"
              rows={3}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleSendComment()
                }
              }}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">Press ⌘+Enter to send</p>
              <Button
                size="sm"
                onClick={handleSendComment}
                disabled={!newComment.trim() || isSendingComment}
              >
                {isSendingComment ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
