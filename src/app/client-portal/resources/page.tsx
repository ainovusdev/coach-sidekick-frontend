'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useClientResources,
  useClientResource,
} from '@/hooks/queries/use-client-resources'
import { useTrackResourceDownload } from '@/hooks/mutations/use-resource-mutations'
import {
  BookOpen,
  FileText,
  Video,
  Link2,
  Download,
  ExternalLink,
  Search,
  RefreshCw,
  AlertCircle,
  ClipboardList,
  Dumbbell,
  FileEdit,
  Newspaper,
  Globe,
  User,
  Calendar,
  CheckCircle,
  Sparkles,
  FolderOpen,
  Eye,
  ArrowUpDown,
  Filter,
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import type { ClientResource, ResourceCategory } from '@/types/resource'
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

type CategoryFilter = 'all' | ResourceCategory
type SortOption = 'newest' | 'oldest' | 'az'

const categoryFilters: { label: string; value: CategoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Worksheets', value: 'worksheet' },
  { label: 'Exercises', value: 'exercise' },
  { label: 'Articles', value: 'article' },
  { label: 'Templates', value: 'template' },
  { label: 'Videos', value: 'video' },
  { label: 'Documents', value: 'document' },
  { label: 'Links', value: 'link' },
]

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function SourceLabel({ source }: { source: string }) {
  const normalized = source.toLowerCase()
  if (normalized.includes('session')) {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <Calendar className="h-3 w-3" />
        From session
      </span>
    )
  }
  if (normalized.includes('client') || normalized.includes('you')) {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <User className="h-3 w-3" />
        Shared with you
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <Globe className="h-3 w-3" />
      From your coach
    </span>
  )
}

// Resource Detail Dialog for reading content
function ResourceReadingDialog({
  resourceId,
  open,
  onOpenChange,
}: {
  resourceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: resource, isLoading } = useClientResource(resourceId || '')

  if (!resource) return null

  const Icon = CATEGORY_ICONS[resource.category] || FileText
  const colors = CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.general

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg ${colors.bg} shrink-0`}>
              <Icon className={`h-5 w-5 ${colors.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl leading-tight">
                {resource.title}
              </DialogTitle>
              {resource.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {resource.description}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Metadata */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className={`text-xs ${colors.bg} ${colors.text} border-0`}
              >
                {CATEGORY_LABELS[resource.category] || resource.category}
              </Badge>
              <SourceLabel source={resource.source} />
              <span className="text-xs text-gray-400">
                {formatDate(resource.created_at)}
              </span>
            </div>

            {/* Text content in reading view */}
            {resource.content && (
              <div className="prose prose-sm max-w-none p-6 bg-gray-50 rounded-lg">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {resource.content}
                </div>
              </div>
            )}

            {/* File details */}
            {resource.file_url && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {resource.file_type || 'File'}
                  </p>
                  {resource.file_size && (
                    <p className="text-xs text-gray-500">
                      {formatFileSize(resource.file_size)}
                    </p>
                  )}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.open(resource.file_url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            )}

            {/* Link details */}
            {resource.content_url && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Link2 className="h-5 w-5 text-gray-500" />
                <p className="flex-1 text-sm text-blue-600 truncate">
                  {resource.content_url}
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    window.open(
                      resource.content_url,
                      '_blank',
                      'noopener,noreferrer',
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open
                </Button>
              </div>
            )}

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {resource.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ResourceCard({
  resource,
  onViewDetail,
}: {
  resource: ClientResource
  onViewDetail: (id: string) => void
}) {
  const trackDownload = useTrackResourceDownload()
  const Icon = CATEGORY_ICONS[resource.category] || FileText
  const colors = CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.general

  const handleDownload = () => {
    if (resource.file_url) {
      trackDownload.mutate(resource.id)
      window.open(resource.file_url, '_blank')
    }
  }

  const handleOpenLink = () => {
    if (resource.content_url) {
      trackDownload.mutate(resource.id)
      window.open(resource.content_url, '_blank', 'noopener,noreferrer')
    }
  }

  const isTextContent =
    resource.content && !resource.file_url && !resource.content_url

  return (
    <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg ${colors.bg} shrink-0`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {resource.title}
              </h3>
              {!resource.is_viewed ? (
                <Badge className="bg-green-100 text-green-700 border-0 text-xs shrink-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  NEW
                </Badge>
              ) : (
                <CheckCircle className="h-4 w-4 text-gray-300 shrink-0" />
              )}
            </div>

            {resource.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {resource.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge
                variant="secondary"
                className={`text-xs ${colors.bg} ${colors.text} border-0`}
              >
                {CATEGORY_LABELS[resource.category] || resource.category}
              </Badge>

              <SourceLabel source={resource.source} />

              {resource.file_size && (
                <span className="text-xs text-gray-400">
                  {formatFileSize(resource.file_size)}
                </span>
              )}
            </div>

            {/* Action buttons - explicit, no card-level click */}
            <div className="flex items-center gap-2 mt-3">
              {resource.file_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleDownload}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              )}
              {resource.content_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleOpenLink}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
              )}
              {isTextContent && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onViewDetail(resource.id)}
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  Read
                </Button>
              )}
              {!resource.file_url &&
                !resource.content_url &&
                !isTextContent && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => onViewDetail(resource.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                )}
            </div>

            <div className="text-xs text-gray-400 mt-2">
              {formatDate(resource.created_at)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ClientResourcesPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewingResourceId, setViewingResourceId] = useState<string | null>(
    null,
  )

  const { data, isLoading, error, refetch } = useClientResources({
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: debouncedSearch || undefined,
  })

  const resources = data?.resources || []
  const total = data?.total || 0

  // Stat calculations
  const unviewedCount = resources.filter(r => !r.is_viewed).length
  const uniqueCategories = new Set(resources.map(r => r.category)).size

  // Sort resources
  const sortedResources = useMemo(() => {
    const sorted = [...resources]
    switch (sortBy) {
      case 'newest':
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
      case 'oldest':
        return sorted.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )
      case 'az':
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      default:
        return sorted
    }
  }, [resources, sortBy])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    const timeout = setTimeout(() => setDebouncedSearch(value), 300)
    return () => clearTimeout(timeout)
  }

  const handleViewDetail = (resourceId: string) => {
    setViewingResourceId(resourceId)
  }

  const statCards = [
    {
      label: 'Total Resources',
      value: total,
      icon: FolderOpen,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'New / Unviewed',
      value: unviewedCount,
      icon: Sparkles,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Categories',
      value: uniqueCategories,
      icon: Filter,
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertCircle className="size-12 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600 mb-4">Failed to load resources</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const hasAnyResources = total > 0
  const hasFilteredResults = sortedResources.length > 0
  const isFiltering = categoryFilter !== 'all' || debouncedSearch

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Resources</h1>
          <p className="text-gray-600 mt-2">
            Documents, exercises, and materials shared by your coach
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="border-gray-300 self-start"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stat Cards */}
      {hasAnyResources && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statCards.map(stat => {
            const StatIcon = stat.icon
            return (
              <Card key={stat.label} className="border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <StatIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Search + Sort Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A-Z</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {categoryFilters.map(filter => (
          <button
            key={filter.value}
            onClick={() => setCategoryFilter(filter.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              categoryFilter === filter.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Resource count */}
      {hasFilteredResults && (
        <p className="text-sm text-gray-500 mb-4">
          {sortedResources.length} resource
          {sortedResources.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Resources Grid or Empty States */}
      {!hasFilteredResults ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            {!hasAnyResources && !isFiltering ? (
              <>
                <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Resources Yet
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  Your coach will share resources here as you progress. Check
                  back later for documents, exercises, and other materials.
                </p>
              </>
            ) : (
              <>
                <Search className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Matching Resources
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  No resources match your filter. Try adjusting your search or
                  category.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setCategoryFilter('all')
                    setSearchQuery('')
                    setDebouncedSearch('')
                  }}
                >
                  Clear Filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedResources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onViewDetail={handleViewDetail}
            />
          ))}
        </div>
      )}

      {/* Resource Reading Detail Dialog */}
      <ResourceReadingDialog
        resourceId={viewingResourceId}
        open={!!viewingResourceId}
        onOpenChange={open => {
          if (!open) setViewingResourceId(null)
        }}
      />
    </div>
  )
}
