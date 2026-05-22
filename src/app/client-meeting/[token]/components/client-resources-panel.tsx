'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Video,
  Link2,
  ClipboardList,
  Dumbbell,
  FileEdit,
  Newspaper,
  BookOpen,
  Download,
  ExternalLink,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import {
  LiveMeetingService,
  LiveMeetingResource,
} from '@/services/live-meeting-service'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/resource'
import type { ResourceCategory } from '@/types/resource'

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  general: FileText,
  document: FileText,
  worksheet: ClipboardList,
  exercise: Dumbbell,
  article: Newspaper,
  template: FileEdit,
  video: Video,
  link: Link2,
}

interface ClientResourcesPanelProps {
  meetingToken: string
  guestToken: string | null
  refreshKey?: number
}

export function ClientResourcesPanel({
  meetingToken,
  guestToken,
  refreshKey = 0,
}: ClientResourcesPanelProps) {
  const [resources, setResources] = useState<LiveMeetingResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResources = useCallback(async () => {
    if (!guestToken) return
    try {
      setIsLoading(true)
      setError(null)
      const data = await LiveMeetingService.getResources(
        meetingToken,
        guestToken,
      )
      setResources(data)
    } catch (err) {
      setError('Failed to load resources')
      console.error('Failed to fetch resources:', err)
    } finally {
      setIsLoading(false)
    }
  }, [meetingToken, guestToken])

  useEffect(() => {
    fetchResources()
  }, [fetchResources, refreshKey])

  // Poll for new resources every 30s
  useEffect(() => {
    if (!guestToken) return
    const interval = setInterval(fetchResources, 30000)
    return () => clearInterval(interval)
  }, [fetchResources, guestToken])

  return (
    <Card className="bg-surface-1 rounded-2xl shadow-sm border border-line flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-line flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-ds-accent-bg rounded-lg">
            <BookOpen className="h-4 w-4 text-ds-accent " />
          </div>
          <h3 className="text-sm font-semibold text-ink ">Shared Resources</h3>
          {resources.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
              {resources.length}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchResources}
          disabled={isLoading}
          className="h-7 w-7 p-0 text-ink-4 hover:text-ink-3"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading && resources.length === 0 ? (
          <div className="p-6 flex items-center justify-center gap-2 text-ink-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading resources...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-ink-3 ">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchResources}
              className="mt-3"
            >
              Retry
            </Button>
          </div>
        ) : resources.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="h-10 w-10 text-ink-2 mx-auto mb-3" />
            <p className="text-sm font-medium text-ink-3 ">No resources yet</p>
            <p className="text-xs text-ink-4 mt-1">
              Resources shared by your coach will appear here
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {resources.map(resource => {
              const Icon = CATEGORY_ICONS[resource.category] || FileText
              const colors =
                CATEGORY_COLORS[resource.category as ResourceCategory] ||
                CATEGORY_COLORS.general

              return (
                <div
                  key={resource.id}
                  className="p-3 rounded-lg border border-line hover:border-line transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg} shrink-0`}>
                      <Icon className={`h-4 w-4 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink ">
                        {resource.title}
                      </p>
                      {resource.description && (
                        <p className="text-xs text-ink-3 mt-0.5 line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${colors.bg} ${colors.text} border-0`}
                        >
                          {CATEGORY_LABELS[
                            resource.category as ResourceCategory
                          ] || resource.category}
                        </Badge>
                        {resource.tags?.length > 0 && (
                          <span className="text-xs text-ink-4">
                            {resource.tags.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3 pl-11">
                    {resource.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          window.open(resource.file_url!, '_blank')
                        }
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                    {resource.content_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          window.open(
                            resource.content_url!,
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open Link
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
