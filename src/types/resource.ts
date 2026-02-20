/**
 * TypeScript interfaces for the Resource Sharing System
 */

export type ResourceCategory =
  | 'general'
  | 'worksheet'
  | 'exercise'
  | 'article'
  | 'template'
  | 'video'
  | 'document'
  | 'link'

export type SharingScope = 'session' | 'client' | 'global'

// Coach-side resource
export interface SharedResource {
  id: string
  coach_id: string
  title: string
  description?: string
  content?: string
  file_url?: string
  file_type?: string
  file_size?: number
  content_url?: string
  resource_type: string // kept for backend compat, but UI uses category
  category: ResourceCategory
  tags: string[]
  sharing_scope: SharingScope
  session_id?: string
  client_id?: string
  is_active: boolean
  view_count: number
  download_count: number
  created_at: string
  updated_at: string
}

// Client-side resource view
export interface ClientResource {
  id: string
  title: string
  description?: string
  content?: string
  file_url?: string
  file_type?: string
  file_size?: number
  content_url?: string
  resource_type: string // kept for backend compat
  category: ResourceCategory
  tags: string[]
  source: string
  is_viewed: boolean
  sharing_scope: SharingScope
  created_at: string
}

// Create resource request (coach-side, uses FormData for file upload)
export interface SharedResourceCreate {
  title: string
  description?: string
  content?: string
  content_url?: string
  category: ResourceCategory
  tags: string[]
  sharing_scope: SharingScope
  session_id?: string
  client_id?: string
}

// Update resource request
export interface SharedResourceUpdate {
  title?: string
  description?: string
  content?: string
  content_url?: string
  category?: ResourceCategory
  tags?: string[]
  is_active?: boolean
}

// Share request
export interface ResourceShareRequest {
  sharing_scope: SharingScope
  client_id?: string
  session_id?: string
}

// List response
export interface SharedResourceListResponse {
  resources: SharedResource[]
  total: number
}

export interface ClientResourceListResponse {
  resources: ClientResource[]
  total: number
}

// Resource filters
export interface ResourceFilters {
  scope?: SharingScope
  category?: ResourceCategory
  client_id?: string
  session_id?: string
  search?: string
  skip?: number
  limit?: number
}

export interface ClientResourceFilters {
  category?: ResourceCategory
  search?: string
  skip?: number
  limit?: number
}

// Category option for UI
export interface CategoryOption {
  value: string
  label: string
}

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  general: 'General',
  worksheet: 'Worksheet',
  exercise: 'Exercise',
  article: 'Article',
  template: 'Template',
  video: 'Video',
  document: 'Document',
  link: 'Link',
}

export const CATEGORY_COLORS: Record<
  ResourceCategory,
  { bg: string; text: string }
> = {
  general: { bg: 'bg-gray-100', text: 'text-gray-700' },
  worksheet: { bg: 'bg-blue-100', text: 'text-blue-700' },
  exercise: { bg: 'bg-green-100', text: 'text-green-700' },
  article: { bg: 'bg-purple-100', text: 'text-purple-700' },
  template: { bg: 'bg-orange-100', text: 'text-orange-700' },
  video: { bg: 'bg-red-100', text: 'text-red-700' },
  document: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  link: { bg: 'bg-teal-100', text: 'text-teal-700' },
}

export const CATEGORY_ICONS_MAP: Record<ResourceCategory, string> = {
  general: 'FileText',
  worksheet: 'ClipboardList',
  exercise: 'Dumbbell',
  article: 'Newspaper',
  template: 'FileEdit',
  video: 'Video',
  document: 'FileText',
  link: 'Link2',
}
