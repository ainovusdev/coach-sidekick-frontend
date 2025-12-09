// Types for Knowledge Hub functionality

export type KnowledgeCategory =
  | 'coaching_improvement'
  | 'realtime_suggestions'
  | 'client_communication'
  | 'coaching_mechanisms'
  | 'general'

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type FileType = 'pdf' | 'docx' | 'txt' | 'audio' | 'video'

export interface KnowledgeDocument {
  id: string
  title: string
  description: string | null
  category: KnowledgeCategory
  tags: string[]
  file_type: FileType
  original_filename: string
  word_count: number
  processing_status: ProcessingStatus
  processing_progress: number
  uploaded_by: string
  uploader_name?: string
  created_at: string
  updated_at: string
}

export interface KnowledgeDocumentDetail extends KnowledgeDocument {
  extracted_text: string
  file_size_bytes: number | null
  extraction_metadata: Record<string, any>
  weaviate_indexed: boolean
  weaviate_chunk_count: number
}

export interface KnowledgeDocumentListResponse {
  documents: KnowledgeDocument[]
  total: number
  page: number
  limit: number
}

export interface KnowledgeDocumentUpdate {
  title?: string
  description?: string | null
  category?: KnowledgeCategory
  tags?: string[]
}

export interface ProcessingStatusResponse {
  document_id: string
  processing_status: ProcessingStatus
  processing_progress: number
  processing_error: string | null
  weaviate_indexed: boolean
}

// Category types
export interface CategoryInfo {
  id: KnowledgeCategory
  name: string
  description: string
  icon: string
  color: string
}

export interface CategoriesResponse {
  categories: CategoryInfo[]
}

// Chat types
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  sources?: KnowledgeSource[]
}

export interface KnowledgeSource {
  document_id: string
  document_title: string
  category: string
  excerpt: string
  relevance_score: number
}

export interface KnowledgeChatRequest {
  question: string
  session_id?: string
  categories?: KnowledgeCategory[]
  conversation_history?: ChatMessage[]
  provider?: 'openai' | 'gemini' | 'claude'
}

export interface KnowledgeChatResponse {
  answer: string
  sources: KnowledgeSource[]
  confidence: 'high' | 'medium' | 'low'
  session_id: string
  suggested_questions: string[]
}

export interface ChatSession {
  id: string
  user_id: string
  title: string | null
  message_count: number
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[]
}

export interface ChatSessionListResponse {
  sessions: ChatSession[]
  total: number
}

// Stats types
export interface KnowledgeStats {
  total_documents: number
  documents_by_category: Record<KnowledgeCategory, number>
  documents_by_status: Record<ProcessingStatus, number>
  total_words: number
  total_chunks_indexed: number
  recent_uploads: KnowledgeDocument[]
}

// Search types
export interface KnowledgeSearchRequest {
  query: string
  categories?: KnowledgeCategory[]
  limit?: number
}

export interface KnowledgeSearchResult {
  document_id: string
  document_title: string
  category: string
  content: string
  relevance_score: number
}

export interface KnowledgeSearchResponse {
  results: KnowledgeSearchResult[]
  total: number
  query: string
}

// Upload form types
export interface DocumentUploadForm {
  title: string
  description: string
  category: KnowledgeCategory
  tags: string
  file: File | null
}

// Category metadata with display info
export const CATEGORY_METADATA: Record<
  KnowledgeCategory,
  { name: string; description: string; icon: string; color: string }
> = {
  coaching_improvement: {
    name: 'Coaching Improvement',
    description:
      'Techniques, methodologies, and best practices for better coaching',
    icon: 'lightbulb',
    color: 'blue',
  },
  realtime_suggestions: {
    name: 'Realtime Suggestions',
    description:
      'Quick reference material for AI-powered live coaching assistance',
    icon: 'zap',
    color: 'yellow',
  },
  client_communication: {
    name: 'Client Communication',
    description: 'Templates, frameworks, and guides for client interactions',
    icon: 'message-circle',
    color: 'green',
  },
  coaching_mechanisms: {
    name: 'Coaching Mechanisms',
    description:
      'Core processes, workflows, and structured coaching approaches',
    icon: 'cog',
    color: 'purple',
  },
  general: {
    name: 'General Resources',
    description: 'Miscellaneous coaching materials and general references',
    icon: 'book-open',
    color: 'gray',
  },
}
