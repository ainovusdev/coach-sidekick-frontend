'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
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
  Search,
  Check,
  Loader2,
  BookOpen,
} from 'lucide-react'
import { useResources } from '@/hooks/queries/use-resources'
import { useShareResource } from '@/hooks/mutations/use-resource-mutations'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/resource'

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

interface MeetingResourcesPanelProps {
  clientId: string
  clientName?: string
}

export function MeetingResourcesPanel({
  clientId,
  clientName,
}: MeetingResourcesPanelProps) {
  const [search, setSearch] = useState('')
  const [sharingId, setSharingId] = useState<string | null>(null)

  const { data: allData, isLoading } = useResources({})
  const shareResource = useShareResource()

  const resources = allData?.resources || []

  const filtered = useMemo(() => {
    if (!search) return resources
    const term = search.toLowerCase()
    return resources.filter(
      r =>
        r.title.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.category.toLowerCase().includes(term),
    )
  }, [resources, search])

  const handleShare = async (resourceId: string) => {
    setSharingId(resourceId)
    try {
      await shareResource.mutateAsync({
        id: resourceId,
        data: { shared_with_client_id: clientId },
      })
    } finally {
      setSharingId(null)
    }
  }

  const isSharedWithClient = (resource: (typeof resources)[0]) => {
    return resource.shares?.some(
      s =>
        s.shared_with_client_id === clientId || s.shared_with_id === clientId,
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-xs pl-8 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading resources...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <BookOpen className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {search ? 'No matching resources' : 'No resources yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(resource => {
              const Icon = CATEGORY_ICONS[resource.category] || FileText
              const colors =
                CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.general
              const alreadyShared = isSharedWithClient(resource)
              const isSharing = sharingId === resource.id

              return (
                <div
                  key={resource.id}
                  className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className={`p-1.5 rounded ${colors.bg} shrink-0`}>
                    <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {resource.title}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1 py-0 mt-0.5 ${colors.bg} ${colors.text} border-0`}
                    >
                      {CATEGORY_LABELS[resource.category] || resource.category}
                    </Badge>
                  </div>

                  {alreadyShared ? (
                    <div className="shrink-0 flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Check className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium">Shared</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] px-2 shrink-0"
                      onClick={() => handleShare(resource.id)}
                      disabled={isSharing}
                    >
                      {isSharing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          Share
                          {clientName && (
                            <span className="ml-0.5 max-w-[60px] truncate">
                              {clientName}
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
