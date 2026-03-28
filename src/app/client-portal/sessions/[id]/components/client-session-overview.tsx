'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Quote,
  CheckCircle2,
  Lightbulb,
  Zap,
  ArrowUpRight,
  MessageSquare,
  FileText,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Circle,
  PlayCircle,
  BookOpen,
  ExternalLink,
  Hash,
  Sparkles,
  Trophy,
  Pencil,
  X,
  Save,
  ClipboardList,
  Dumbbell,
  Newspaper,
  Video,
  Link2,
  StickyNote,
} from 'lucide-react'
import { NotesList } from '@/components/session-notes/notes-list'
import { formatDate } from '@/lib/date-utils'
import { CommitmentService } from '@/services/commitment-service'
import { commitmentTypeLabels } from '@/types/commitment'
import { toast } from 'sonner'
import type { ClientSessionDetailData } from '@/hooks/queries/use-client-sessions'

interface ClientSessionOverviewProps {
  sessionData: ClientSessionDetailData
  sessionId: string
  commitments: any[]
  onRefetchCommitments: () => void
}

// ---- Resource category helpers ----
const CATEGORY_ICONS: Record<string, any> = {
  document: FileText,
  worksheet: ClipboardList,
  exercise: Dumbbell,
  article: Newspaper,
  template: FileText,
  video: Video,
  link: Link2,
}

const CATEGORY_COLORS: Record<string, string> = {
  document: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  worksheet:
    'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  exercise:
    'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  article:
    'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  template: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  video: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  link: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  document: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  worksheet:
    'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  exercise:
    'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  article:
    'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  template: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  video: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  link: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300',
}

// ---- Commitment Item with inline editing ----
function CommitmentItem({
  commitment,
  onUpdate,
}: {
  commitment: any
  onUpdate: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(commitment.title)
  const [editDescription, setEditDescription] = useState(
    commitment.description || '',
  )
  const [editPriority, setEditPriority] = useState(
    commitment.priority || 'medium',
  )
  const [isSaving, setIsSaving] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    try {
      await CommitmentService.updateCommitment(commitment.id, {
        status: newStatus as any,
      })
      const statusLabels: Record<string, string> = {
        active: 'Committed',
        in_progress: 'In Progress',
        completed: 'Done',
      }
      toast.success(`Commitment moved to ${statusLabels[newStatus]}`)
      onUpdate()
    } catch {
      toast.error('Failed to update commitment')
    }
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    try {
      await CommitmentService.updateCommitment(commitment.id, {
        title: editTitle,
        description: editDescription,
        priority: editPriority as any,
      })
      toast.success('Commitment updated')
      setIsEditing(false)
      onUpdate()
    } catch {
      toast.error('Failed to update commitment')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditTitle(commitment.title)
    setEditDescription(commitment.description || '')
    setEditPriority(commitment.priority || 'medium')
    setIsEditing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800'
      case 'in_progress':
        return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600'
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {getStatusIcon(commitment.status)}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          <p
            className={`text-sm font-medium flex-1 dark:text-gray-200 ${
              commitment.status === 'completed'
                ? 'line-through text-gray-500 dark:text-gray-500'
                : ''
            }`}
          >
            {commitment.title}
          </p>
        </div>
        <Select value={commitment.status} onValueChange={handleStatusChange}>
          <SelectTrigger
            className={`h-8 w-[130px] text-xs border ${getStatusColor(commitment.status)}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <Circle className="h-3 w-3" />
                Committed
              </div>
            </SelectItem>
            <SelectItem value="in_progress">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-3 w-3" />
                In Progress
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" />
                Done
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {isEditing ? (
            /* Inline edit form */
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Title
                </label>
                <Input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Description
                </label>
                <Textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Priority
                </label>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="h-7 text-xs gap-1"
                >
                  <Save className="h-3 w-3" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-7 text-xs gap-1"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* Read view */
            <>
              {commitment.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {commitment.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                  {commitment.priority && (
                    <span>
                      Priority: <strong>{commitment.priority}</strong>
                    </span>
                  )}
                  {commitment.target_date && (
                    <span>
                      Due:{' '}
                      <strong>
                        {formatDate(commitment.target_date, 'MMM d, yyyy')}
                      </strong>
                    </span>
                  )}
                  {commitment.type && (
                    <span>
                      Type:{' '}
                      <strong>
                        {commitmentTypeLabels[commitment.type] ||
                          commitment.type}
                      </strong>
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-7 text-xs gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ---- Main component ----
export function ClientSessionOverview({
  sessionData,
  sessionId,
  commitments,
  onRefetchCommitments,
}: ClientSessionOverviewProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    transcript: false,
  })

  const session = sessionData.session
  const hasTranscript =
    sessionData.transcript && sessionData.transcript.length > 0
  const hasMaterials = sessionData.materials && sessionData.materials.length > 0
  const insights = sessionData.insights
  const wins = insights?.wins ?? []

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const completedCommitments = commitments.filter(
    c => c.status === 'completed',
  ).length
  const totalCommitments = commitments.length
  const completionPct =
    totalCommitments > 0
      ? Math.round((completedCommitments / totalCommitments) * 100)
      : 0

  const suggestions =
    insights?.suggestions?.filter(
      (s: any) => !s || typeof s === 'string' || s.target !== 'coach_only',
    ) ?? []

  return (
    <div className="space-y-6">
      {/* Summary Section with Topics & Keywords inline */}
      {(session.summary || (insights?.topics?.length ?? 0) > 0) && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Quote className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Session Summary
            </h2>
            <Badge
              variant="secondary"
              className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs ml-auto"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI Generated
            </Badge>
          </div>
          <div className="p-5 space-y-4">
            {session.summary && (
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {session.summary}
              </p>
            )}
            {/* Topics inline */}
            {((insights?.topics?.length ?? 0) > 0 ||
              (session.key_topics?.length ?? 0) > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Topics Discussed
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(insights?.topics?.length
                    ? insights.topics
                    : (session.key_topics ?? [])
                  ).map((topic: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Keywords */}
            {(insights?.keywords?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {insights!.keywords
                  .slice(0, 10)
                  .map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded"
                    >
                      {keyword}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Commitments & Wins — 2 column on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commitments */}
        {(commitments.length > 0 ||
          (session.action_items && session.action_items.length > 0)) && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Commitments
                  </h2>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  {commitments.length > 0
                    ? `${completedCommitments}/${totalCommitments} done`
                    : `${session.action_items?.length || 0} items`}
                </Badge>
              </div>
              {commitments.length > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={completionPct} className="flex-1 h-2" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {completionPct}%
                  </span>
                </div>
              )}
            </div>
            {commitments.length > 0 ? (
              <div className="p-4 space-y-2">
                {commitments.map((commitment: any) => (
                  <CommitmentItem
                    key={commitment.id}
                    commitment={commitment}
                    onUpdate={onRefetchCommitments}
                  />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {session.action_items?.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {typeof item === 'string'
                        ? item
                        : item.text || item.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wins */}
        {wins.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Wins & Achievements
              </h2>
              <Badge
                variant="secondary"
                className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs ml-auto"
              >
                {wins.length}
              </Badge>
            </div>
            <div className="p-4 space-y-2">
              {wins.map((win: any, index: number) => (
                <div
                  key={win.id || index}
                  className="flex items-start gap-3 p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg"
                >
                  <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Trophy className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {win.title}
                    </p>
                    {win.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {win.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Key Insights — Bento Grid */}
      {insights?.insights && insights.insights.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Key Insights
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insights.insights
                .slice(0, 3)
                .map((insight: string, index: number) => (
                  <div
                    key={index}
                    className="relative p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="absolute top-3 right-3">
                      <span className="text-2xl font-bold text-gray-200 dark:text-gray-700">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <Zap className="h-4 w-4 text-gray-500 dark:text-gray-400 mb-2" />
                    <p className="text-sm text-gray-700 dark:text-gray-300 pr-8">
                      {insight}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Recommendations
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {suggestions.map((suggestion: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="h-5 w-5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {typeof suggestion === 'string'
                    ? suggestion
                    : suggestion.text || suggestion.suggestion || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes & Resources — 2 column on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Notes — always visible with type badges */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Session Notes
            </h2>
          </div>
          <div className="p-4">
            <NotesList sessionId={sessionId} isClientPortal={true} />
          </div>
        </div>

        {/* Materials & Resources — with category icons/colors */}
        {hasMaterials && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Resources
              </h2>
              <Badge
                variant="secondary"
                className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs ml-auto"
              >
                {sessionData.materials.length}
              </Badge>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sessionData.materials.map(material => {
                const IconComponent =
                  CATEGORY_ICONS[material.material_type] || FileText
                const iconColor =
                  CATEGORY_COLORS[material.material_type] ||
                  CATEGORY_COLORS.template
                const badgeColor =
                  CATEGORY_BADGE_COLORS[material.material_type] ||
                  CATEGORY_BADGE_COLORS.template
                return (
                  <div
                    key={material.id}
                    className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {material.title}
                        </p>
                        {material.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                            {material.description}
                          </p>
                        )}
                        <Badge
                          variant="secondary"
                          className={`mt-1.5 text-xs capitalize ${badgeColor}`}
                        >
                          {material.material_type}
                        </Badge>
                      </div>
                      {material.file_url && (
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Transcript */}
      {hasTranscript && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('transcript')}
            className="w-full px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Conversation Transcript
              </h2>
              <Badge
                variant="secondary"
                className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs ml-2"
              >
                {sessionData.transcript.length} messages
              </Badge>
            </div>
            {expandedSections.transcript ? (
              <ChevronUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            )}
          </button>

          {expandedSections.transcript ? (
            <ScrollArea className="h-[400px]">
              <div className="p-5 space-y-4">
                {sessionData.transcript.map((entry, index) => {
                  const isCoach = entry.speaker?.toLowerCase().includes('coach')
                  return (
                    <div
                      key={index}
                      className={`flex gap-3 ${isCoach ? '' : 'flex-row-reverse'}`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCoach
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <User className="h-4 w-4" />
                      </div>
                      <div
                        className={`max-w-[80%] ${isCoach ? '' : 'text-right'}`}
                      >
                        <div
                          className={`flex items-center gap-2 mb-1 ${isCoach ? '' : 'justify-end'}`}
                        >
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {entry.speaker}
                          </span>
                          {entry.timestamp && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatDate(entry.timestamp, 'h:mm a')}
                            </span>
                          )}
                        </div>
                        <div
                          className={`inline-block px-4 py-2 rounded-2xl text-sm ${
                            isCoach
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-tl-sm'
                              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-tr-sm'
                          }`}
                        >
                          {entry.text}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="p-5">
              <div className="space-y-2">
                {sessionData.transcript.slice(0, 3).map((entry, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                        entry.speaker?.toLowerCase().includes('coach')
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {entry.speaker?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toggleSection('transcript')}
                className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium flex items-center gap-1"
              >
                View full transcript
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
