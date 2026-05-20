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

export type SharingScope = 'personal' | 'session' | 'global'

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
  source_type?: 'shared_resource'
  shares?: ResourceShareInfo[]
  session_id?: string
  client_id?: string
  is_active: boolean
  view_count: number
  download_count: number
  created_at: string
  updated_at: string
}

export interface ResourceShareInfo {
  id: string
  resource_id: string
  shared_by_id: string
  shared_with_client_id?: string
  shared_with_id?: string
  shared_with_name?: string
  note?: string
  created_at: string
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
  shared_with_client_id: string
  note?: string
}

export interface ResourceShareListResponse {
  shares: ResourceShareInfo[]
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
  scope?: SharingScope | string
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
  general: {
    bg: 'bg-surface-3 ',
    text: 'text-ink-2 ',
  },
  worksheet: {
    bg: 'bg-ds-accent-bg ',
    text: 'text-ds-accent ',
  },
  exercise: {
    bg: 'bg-forest-bg ',
    text: 'text-forest ',
  },
  article: {
    bg: 'bg-indigo-bg ',
    text: 'text-indigo ',
  },
  template: {
    bg: 'bg-amber-token-bg ',
    text: 'text-amber-token ',
  },
  video: {
    bg: 'bg-vermillion-bg ',
    text: 'text-vermillion ',
  },
  document: {
    bg: 'bg-indigo-bg ',
    text: 'text-indigo ',
  },
  link: {
    bg: 'bg-forest-bg ',
    text: 'text-forest ',
  },
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
