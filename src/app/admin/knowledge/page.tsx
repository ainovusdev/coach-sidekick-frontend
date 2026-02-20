'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { knowledgeService } from '@/services/knowledge-service'
import type {
  KnowledgeDocument,
  KnowledgeCategory,
  ProcessingStatus,
} from '@/types/knowledge'
import { CATEGORY_METADATA } from '@/types/knowledge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Plus,
  Search,
  FileText,
  Trash2,
  Eye,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileAudio,
  FileVideo,
  BookOpen,
  Lightbulb,
  Zap,
  MessageCircle,
  Cog,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { formatDate } from '@/lib/date-utils'

const categoryIcons: Record<KnowledgeCategory, React.ReactNode> = {
  coaching_improvement: <Lightbulb className="h-4 w-4" />,
  realtime_suggestions: <Zap className="h-4 w-4" />,
  client_communication: <MessageCircle className="h-4 w-4" />,
  coaching_mechanisms: <Cog className="h-4 w-4" />,
  general: <BookOpen className="h-4 w-4" />,
}

const statusConfig: Record<
  ProcessingStatus,
  { icon: React.ReactNode; color: string; label: string }
> = {
  pending: {
    icon: <Clock className="h-3 w-3" />,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Pending',
  },
  processing: {
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    color: 'bg-blue-100 text-blue-800',
    label: 'Processing',
  },
  completed: {
    icon: <CheckCircle className="h-3 w-3" />,
    color: 'bg-green-100 text-green-800',
    label: 'Completed',
  },
  failed: {
    icon: <XCircle className="h-3 w-3" />,
    color: 'bg-red-100 text-red-800',
    label: 'Failed',
  },
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5 text-red-500" />,
  docx: <FileText className="h-5 w-5 text-blue-500" />,
  txt: <FileText className="h-5 w-5 text-gray-500" />,
  audio: <FileAudio className="h-5 w-5 text-purple-500" />,
  video: <FileVideo className="h-5 w-5 text-pink-500" />,
}

export default function KnowledgeHubPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [viewDocument, setViewDocument] = useState<string | null>(null)
  const [deleteDocument, setDeleteDocument] =
    useState<KnowledgeDocument | null>(null)

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadCategory, setUploadCategory] =
    useState<KnowledgeCategory>('general')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadTags, setUploadTags] = useState('')
  const [_uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch documents
  const { data: documentsData, isLoading } = useQuery({
    queryKey: [
      'knowledge-documents',
      searchQuery,
      categoryFilter,
      statusFilter,
    ],
    queryFn: () =>
      knowledgeService.listDocuments({
        search: searchQuery || undefined,
        category:
          categoryFilter !== 'all'
            ? (categoryFilter as KnowledgeCategory)
            : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 50,
      }),
  })

  // Fetch document detail for viewing
  const { data: documentDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['knowledge-document', viewDocument],
    queryFn: () =>
      viewDocument ? knowledgeService.getDocument(viewDocument) : null,
    enabled: !!viewDocument,
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: () => knowledgeService.getStats(),
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('No file selected')
      const tags = uploadTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
      return knowledgeService.uploadDocument(
        uploadFile,
        uploadTitle,
        uploadCategory,
        uploadDescription || undefined,
        tags.length > 0 ? tags : undefined,
      )
    },
    onSuccess: async document => {
      setUploadDialogOpen(false)
      resetUploadForm()
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-stats'] })

      // Poll for processing status
      try {
        await knowledgeService.pollDocumentStatus(document.id, status =>
          setUploadProgress(status.processing_progress),
        )
        queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] })
      } catch (err) {
        console.error('Processing failed:', err)
      }
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      knowledgeService.deleteDocument(documentId),
    onSuccess: () => {
      setDeleteDocument(null)
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-stats'] })
    },
  })

  const resetUploadForm = () => {
    setUploadFile(null)
    setUploadTitle('')
    setUploadCategory('general')
    setUploadDescription('')
    setUploadTags('')
    setUploadProgress(0)
    setIsUploading(false)
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        setUploadFile(file)
        if (!uploadTitle) {
          setUploadTitle(file.name.replace(/\.[^/.]+$/, ''))
        }
      }
    },
    [uploadTitle],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'text/plain': ['.txt'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.webm'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
    },
    maxFiles: 1,
  })

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle || !uploadCategory) return
    setIsUploading(true)
    try {
      await uploadMutation.mutateAsync()
    } finally {
      setIsUploading(false)
    }
  }

  const documents = documentsData?.documents ?? []

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Hub</h1>
          <p className="text-gray-600 mt-1">
            Manage coaching resources and knowledge documents
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Documents</p>
                  <p className="text-2xl font-bold">{stats.total_documents}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Words</p>
                  <p className="text-2xl font-bold">
                    {stats.total_words.toLocaleString()}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Indexed Chunks</p>
                  <p className="text-2xl font-bold">
                    {stats.total_chunks_indexed}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Processing</p>
                  <p className="text-2xl font-bold">
                    {stats.documents_by_status?.processing || 0}
                  </p>
                </div>
                <Loader2 className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_METADATA).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                {meta.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No documents found
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by uploading your first document'}
            </p>
            {!searchQuery &&
              categoryFilter === 'all' &&
              statusFilter === 'all' && (
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => {
            const status =
              statusConfig[doc.processing_status as ProcessingStatus]
            const categoryMeta =
              CATEGORY_METADATA[doc.category as KnowledgeCategory]

            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      {fileTypeIcons[doc.file_type] || (
                        <FileText className="h-5 w-5 text-gray-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {doc.title}
                        </h3>
                        <Badge variant="outline" className={status.color}>
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          {categoryIcons[doc.category as KnowledgeCategory]}
                          {categoryMeta?.name || doc.category}
                        </span>
                        <span>{doc.word_count.toLocaleString()} words</span>
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                      {doc.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {doc.tags.slice(0, 3).map(tag => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
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
                      {doc.processing_status === 'processing' && (
                        <Progress
                          value={doc.processing_progress}
                          className="mt-2 h-1"
                        />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewDocument(doc.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDocument(doc)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document to add to the knowledge hub
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              {uploadFile ? (
                <div className="flex items-center justify-center gap-2">
                  {fileTypeIcons[uploadFile.name.split('.').pop() || ''] || (
                    <FileText className="h-5 w-5" />
                  )}
                  <span className="font-medium">{uploadFile.name}</span>
                  <span className="text-gray-500">
                    ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">
                    Drag & drop a file here, or click to select
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Supports PDF, DOCX, TXT, audio, and video files
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder="Document title"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={uploadCategory}
                onValueChange={v => setUploadCategory(v as KnowledgeCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_METADATA).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {categoryIcons[key as KnowledgeCategory]}
                        {meta.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={uploadDescription}
                onChange={e => setUploadDescription(e.target.value)}
                placeholder="Brief description of the document"
                rows={2}
              />
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags (optional, comma-separated)</Label>
              <Input
                id="tags"
                value={uploadTags}
                onChange={e => setUploadTags(e.target.value)}
                placeholder="coaching, techniques, beginner"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || !uploadTitle || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                {formatDate(documentDetail.created_at)}
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
                  <div className="flex gap-1 mt-1">
                    {documentDetail.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-gray-500">Extracted Content</Label>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {documentDetail.extracted_text ||
                      'No content extracted yet'}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">File Type</Label>
                  <p className="mt-1">
                    {documentDetail.file_type.toUpperCase()}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">File Size</Label>
                  <p className="mt-1">
                    {documentDetail.file_size_bytes
                      ? `${(documentDetail.file_size_bytes / 1024 / 1024).toFixed(2)} MB`
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Indexed</Label>
                  <p className="mt-1">
                    {documentDetail.weaviate_indexed ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Chunks</Label>
                  <p className="mt-1">{documentDetail.weaviate_chunk_count}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteDocument}
        onOpenChange={() => setDeleteDocument(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDocument?.title}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDocument && deleteMutation.mutate(deleteDocument.id)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
