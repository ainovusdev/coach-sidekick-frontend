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
  document: 'bg-ds-accent-bg text-ds-accent ',
  worksheet: 'bg-indigo-bg text-indigo ',
  exercise: 'bg-amber-token-bg text-amber-token ',
  article: 'bg-forest-bg text-forest ',
  template: 'bg-surface-3 text-ink-3 ',
  video: 'bg-vermillion-bg text-vermillion ',
  link: 'bg-ds-accent-bg text-ds-accent ',
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  document: 'bg-ds-accent-bg text-ds-accent ',
  worksheet: 'bg-indigo-bg text-indigo ',
  exercise: 'bg-amber-token-bg text-amber-token ',
  article: 'bg-forest-bg text-forest ',
  template: 'bg-paper text-ink-2 ',
  video: 'bg-vermillion-bg text-vermillion ',
  link: 'bg-ds-accent-bg text-ds-accent ',
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
        return <CheckCircle2 className="h-4 w-4 text-forest" />
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-ds-accent" />
      default:
        return <Circle className="h-4 w-4 text-ink-3 " />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-forest bg-forest-bg border-forest '
      case 'in_progress':
        return 'text-ds-accent bg-ds-accent-bg border-ds-accent '
      default:
        return 'text-ink-2 bg-paper border-line '
    }
  }

  return (
    <div className="border border-line rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-3 hover:bg-paper transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {getStatusIcon(commitment.status)}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-0.5 hover:bg-surface-3 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-ink-3 " />
            ) : (
              <ChevronRight className="h-4 w-4 text-ink-3 " />
            )}
          </button>
          <p
            className={`text-sm font-medium flex-1 ${
              commitment.status === 'completed'
                ? 'line-through text-ink-3 '
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
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-line bg-paper ">
          {isEditing ? (
            /* Inline edit form */
            <div className="space-y-3">
              <div>
                <label className="text-xs text-ink-3 mb-1 block">Title</label>
                <Input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-ink-3 mb-1 block">
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
                <label className="text-xs text-ink-3 mb-1 block">
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
                <p className="text-sm text-ink-3 ">{commitment.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-3 text-xs text-ink-3 ">
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
                  className="h-7 text-xs gap-1 text-ink-3 hover:text-ink-2 "
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
        <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2">
            <Quote className="h-4 w-4 text-ink-3 " />
            <h2 className="font-semibold text-ink ">Session Summary</h2>
            <Badge
              variant="secondary"
              className="bg-surface-3 text-ink-3 text-xs ml-auto"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI Generated
            </Badge>
          </div>
          <div className="p-5 space-y-4">
            {session.summary && (
              <p className="text-ink-3 leading-relaxed">{session.summary}</p>
            )}
            {/* Topics inline */}
            {((insights?.topics?.length ?? 0) > 0 ||
              (session.key_topics?.length ?? 0) > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-3.5 w-3.5 text-ink-4" />
                  <span className="text-xs font-medium text-ink-3 uppercase tracking-wide">
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
                      className="px-3 py-1.5 bg-surface-3 text-ink-2 text-sm rounded-lg"
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
                      className="px-2 py-1 border border-line text-ink-3 text-xs rounded"
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
          <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-line ">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-ink-3 " />
                  <h2 className="font-semibold text-ink ">Commitments</h2>
                </div>
                <Badge variant="secondary" className="bg-surface-3 text-ink-3 ">
                  {commitments.length > 0
                    ? `${completedCommitments}/${totalCommitments} done`
                    : `${session.action_items?.length || 0} items`}
                </Badge>
              </div>
              {commitments.length > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={completionPct} className="flex-1 h-2" />
                  <span className="text-xs text-ink-3 font-medium">
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
              <div className="divide-y divide-line ">
                {session.action_items?.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="px-5 py-3 flex items-start gap-3 hover:bg-paper transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-ink text-ink-on-dark flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm text-ink-2 leading-relaxed">
                      {typeof item === 'string'
                        ? item
                        : item.item || item.text || item.title || String(item)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wins */}
        {wins.length > 0 && (
          <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-token" />
              <h2 className="font-semibold text-ink ">Wins & Achievements</h2>
              <Badge
                variant="secondary"
                className="bg-amber-token-bg text-amber-token text-xs ml-auto"
              >
                {wins.length}
              </Badge>
            </div>
            <div className="p-4 space-y-2">
              {wins.map((win: any, index: number) => (
                <div
                  key={win.id || index}
                  className="flex items-start gap-3 p-3 bg-amber-token-bg/50 border border-amber-token rounded-lg"
                >
                  <div className="h-6 w-6 rounded-full bg-amber-token-bg text-amber-token flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Trophy className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink ">{win.title}</p>
                    {win.description && (
                      <p className="text-xs text-ink-3 mt-0.5 line-clamp-2">
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
        <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-ink-3 " />
            <h2 className="font-semibold text-ink ">Key Insights</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insights.insights
                .slice(0, 3)
                .map((insight: string, index: number) => (
                  <div
                    key={index}
                    className="relative p-4 bg-paper rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="absolute top-3 right-3">
                      <span className="text-2xl font-bold text-ink-2 ">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <Zap className="h-4 w-4 text-ink-3 mb-2" />
                    <p className="text-sm text-ink-2 pr-8">{insight}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {suggestions.length > 0 && (
        <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-ink-3 " />
            <h2 className="font-semibold text-ink ">Recommendations</h2>
          </div>
          <div className="p-5 space-y-3">
            {suggestions.map((suggestion: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-paper rounded-lg"
              >
                <div className="h-5 w-5 rounded-full bg-ink text-ink-on-dark flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <span className="text-sm text-ink-2 ">
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
        <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-ink-3 " />
            <h2 className="font-semibold text-ink ">Session Notes</h2>
          </div>
          <div className="p-4">
            <NotesList sessionId={sessionId} isClientPortal={true} />
          </div>
        </div>

        {/* Materials & Resources — with category icons/colors */}
        {hasMaterials && (
          <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-ink-3 " />
              <h2 className="font-semibold text-ink ">Resources</h2>
              <Badge
                variant="secondary"
                className="bg-surface-3 text-ink-3 text-xs ml-auto"
              >
                {sessionData.materials.length}
              </Badge>
            </div>
            <div className="divide-y divide-line ">
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
                    className="px-5 py-3 hover:bg-paper transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink ">
                          {material.title}
                        </p>
                        {material.description && (
                          <p className="text-xs text-ink-3 mt-0.5 line-clamp-1">
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
                          className="text-ink-4 hover:text-ink-3 p-1"
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
        <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('transcript')}
            className="w-full px-5 py-4 border-b border-line flex items-center justify-between hover:bg-paper transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-ink-3 " />
              <h2 className="font-semibold text-ink ">
                Conversation Transcript
              </h2>
              <Badge
                variant="secondary"
                className="bg-surface-3 text-ink-3 text-xs ml-2"
              >
                {sessionData.transcript.length} messages
              </Badge>
            </div>
            {expandedSections.transcript ? (
              <ChevronUp className="h-4 w-4 text-ink-4 " />
            ) : (
              <ChevronDown className="h-4 w-4 text-ink-4 " />
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
                            ? 'bg-ink text-ink-on-dark '
                            : 'bg-surface-3 text-ink-3 '
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
                          <span className="text-xs font-medium text-ink-2 ">
                            {entry.speaker}
                          </span>
                          {entry.timestamp && (
                            <span className="text-xs text-ink-4 ">
                              {formatDate(entry.timestamp, 'h:mm a')}
                            </span>
                          )}
                        </div>
                        <div
                          className={`inline-block px-4 py-2 rounded-2xl text-sm ${
                            isCoach
                              ? 'bg-surface-3 text-ink-2 rounded-tl-sm'
                              : 'bg-ink text-ink-on-dark rounded-tr-sm'
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
                          ? 'bg-ink text-ink-on-dark '
                          : 'bg-surface-3 text-ink-3 '
                      }`}
                    >
                      {entry.speaker?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm text-ink-3 truncate flex-1">
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toggleSection('transcript')}
                className="mt-3 text-sm text-ink-3 hover:text-ink-2 font-medium flex items-center gap-1"
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
