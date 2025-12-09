'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { knowledgeService } from '@/services/knowledge-service'
import type { KnowledgeCategory } from '@/types/knowledge'
import { CATEGORY_METADATA } from '@/types/knowledge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  FileText,
  Eye,
  Loader2,
  BookOpen,
  Lightbulb,
  Zap,
  MessageCircle,
  Cog,
  FileAudio,
  FileVideo,
} from 'lucide-react'
import Navigation from '@/components/layout/navigation'
import { KnowledgeChatButton } from '@/components/knowledge/knowledge-chat-button'

const categoryIcons: Record<KnowledgeCategory, React.ReactNode> = {
  coaching_improvement: <Lightbulb className="h-5 w-5" />,
  realtime_suggestions: <Zap className="h-5 w-5" />,
  client_communication: <MessageCircle className="h-5 w-5" />,
  coaching_mechanisms: <Cog className="h-5 w-5" />,
  general: <BookOpen className="h-5 w-5" />,
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5 text-red-500" />,
  docx: <FileText className="h-5 w-5 text-blue-500" />,
  txt: <FileText className="h-5 w-5 text-gray-500" />,
  audio: <FileAudio className="h-5 w-5 text-purple-500" />,
  video: <FileVideo className="h-5 w-5 text-pink-500" />,
}

const categoryColors: Record<KnowledgeCategory, string> = {
  coaching_improvement: 'bg-blue-100 text-blue-700 border-blue-200',
  realtime_suggestions: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  client_communication: 'bg-green-100 text-green-700 border-green-200',
  coaching_mechanisms: 'bg-purple-100 text-purple-700 border-purple-200',
  general: 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function KnowledgeBrowsePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewDocument, setViewDocument] = useState<string | null>(null)

  // Fetch documents
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['knowledge-browse', searchQuery, selectedCategory],
    queryFn: () =>
      knowledgeService.listDocuments({
        search: searchQuery || undefined,
        category:
          selectedCategory !== 'all'
            ? (selectedCategory as KnowledgeCategory)
            : undefined,
        status: 'completed', // Only show completed documents to users
        limit: 50,
      }),
  })

  // Fetch document detail
  const { data: documentDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['knowledge-document', viewDocument],
    queryFn: () =>
      viewDocument ? knowledgeService.getDocument(viewDocument) : null,
    enabled: !!viewDocument,
  })

  // Fetch stats for category counts
  const { data: stats } = useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: () => knowledgeService.getStats(),
  })

  const documents = documentsData?.documents ?? []

  // Group documents by category for the "All" view
  const groupedDocuments = documents.reduce(
    (acc, doc) => {
      const category = doc.category as KnowledgeCategory
      if (!acc[category]) acc[category] = []
      acc[category].push(doc)
      return acc
    },
    {} as Record<KnowledgeCategory, typeof documents>,
  )

  return (
    <>
      <Navigation />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Knowledge Hub</h1>
            <p className="text-gray-600 mt-1">
              Browse coaching resources and documentation
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg"
            />
          </div>

          {/* Category Tabs */}
          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="mb-8"
          >
            <TabsList className="flex flex-wrap gap-2 bg-transparent h-auto p-0">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-gray-900 data-[state=active]:text-white px-4 py-2"
              >
                All
                {stats && (
                  <Badge variant="secondary" className="ml-2">
                    {stats.total_documents}
                  </Badge>
                )}
              </TabsTrigger>
              {Object.entries(CATEGORY_METADATA).map(([key, meta]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="data-[state=active]:bg-gray-900 data-[state=active]:text-white px-4 py-2"
                >
                  <span className="flex items-center gap-2">
                    {categoryIcons[key as KnowledgeCategory]}
                    {meta.name}
                    {stats?.documents_by_category?.[
                      key as KnowledgeCategory
                    ] && (
                      <Badge variant="secondary" className="ml-1">
                        {stats.documents_by_category[key as KnowledgeCategory]}
                      </Badge>
                    )}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Content */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <Card className="mt-6">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No documents found
                  </h3>
                  <p className="text-gray-600 text-center">
                    {searchQuery
                      ? 'Try adjusting your search query'
                      : 'No documents available in this category'}
                  </p>
                </CardContent>
              </Card>
            ) : selectedCategory === 'all' ? (
              // Grouped view for "All" tab
              <div className="mt-6 space-y-8">
                {Object.entries(groupedDocuments).map(([category, docs]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-4">
                      {categoryIcons[category as KnowledgeCategory]}
                      <h2 className="text-xl font-semibold text-gray-900">
                        {CATEGORY_METADATA[category as KnowledgeCategory]
                          ?.name || category}
                      </h2>
                      <Badge variant="outline">{docs.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {docs.map(doc => (
                        <DocumentCard
                          key={doc.id}
                          doc={doc}
                          onView={() => setViewDocument(doc.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Grid view for specific category
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {documents.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onView={() => setViewDocument(doc.id)}
                  />
                ))}
              </div>
            )}
          </Tabs>
        </div>
      </div>

      {/* View Document Dialog */}
      <Dialog open={!!viewDocument} onOpenChange={() => setViewDocument(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{documentDetail?.title || 'Document'}</DialogTitle>
            {documentDetail && (
              <DialogDescription>
                {CATEGORY_METADATA[documentDetail.category as KnowledgeCategory]
                  ?.name || documentDetail.category}
                {' • '}
                {documentDetail.word_count.toLocaleString()} words
                {' • '}
                {new Date(documentDetail.created_at).toLocaleDateString()}
              </DialogDescription>
            )}
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            </div>
          ) : documentDetail ? (
            <div className="space-y-4">
              {documentDetail.description && (
                <div>
                  <Label className="text-gray-500">Description</Label>
                  <p className="mt-1">{documentDetail.description}</p>
                </div>
              )}

              {documentDetail.tags.length > 0 && (
                <div>
                  <Label className="text-gray-500">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {documentDetail.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-gray-500">Content</Label>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {documentDetail.extracted_text || 'No content available'}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Knowledge Chat Floating Button */}
      <KnowledgeChatButton />
    </>
  )
}

// Document Card Component
function DocumentCard({
  doc,
  onView,
}: {
  doc: {
    id: string
    title: string
    description: string | null
    category: string
    tags: string[]
    file_type: string
    word_count: number
    created_at: string
  }
  onView: () => void
}) {
  const categoryMeta = CATEGORY_METADATA[doc.category as KnowledgeCategory]

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onView}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-shrink-0">
            {fileTypeIcons[doc.file_type] || (
              <FileText className="h-5 w-5 text-gray-500" />
            )}
          </div>
          <Badge
            variant="outline"
            className={categoryColors[doc.category as KnowledgeCategory]}
          >
            {categoryMeta?.name || doc.category}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-2 line-clamp-2">{doc.title}</CardTitle>
        {doc.description && (
          <CardDescription className="line-clamp-2">
            {doc.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{doc.word_count.toLocaleString()} words</span>
          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
        </div>
        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {doc.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {doc.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{doc.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3"
          onClick={e => {
            e.stopPropagation()
            onView()
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Content
        </Button>
      </CardContent>
    </Card>
  )
}
