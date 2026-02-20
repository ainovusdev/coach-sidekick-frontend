'use client'

import { useState, useRef, useCallback } from 'react'
import type {
  SharedResource,
  ResourceCategory,
  SharingScope,
} from '@/types/resource'

export interface ResourceFormState {
  title: string
  description: string
  type: 'file' | 'link' | 'text'
  category: ResourceCategory
  scope: SharingScope
  contentUrl: string
  content: string
  tags: string
  clientId: string
  sessionId: string
  selectedFile: File | null
}

const initialState: ResourceFormState = {
  title: '',
  description: '',
  type: 'text',
  category: 'general',
  scope: 'global',
  contentUrl: '',
  content: '',
  tags: '',
  clientId: '',
  sessionId: '',
  selectedFile: null,
}

export function useResourceForm() {
  const [form, setForm] = useState<ResourceFormState>(initialState)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setField = useCallback(
    <K extends keyof ResourceFormState>(
      key: K,
      value: ResourceFormState[K],
    ) => {
      setForm(prev => ({ ...prev, [key]: value }))
    },
    [],
  )

  const resetForm = useCallback(() => {
    setForm(initialState)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const populateForEdit = useCallback((resource: SharedResource) => {
    setForm({
      title: resource.title,
      description: resource.description || '',
      type: resource.file_url ? 'file' : resource.content_url ? 'link' : 'text',
      category: resource.category,
      scope: resource.sharing_scope,
      contentUrl: resource.content_url || '',
      content: resource.content || '',
      tags: (resource.tags || []).join(', '),
      clientId: resource.client_id || '',
      sessionId: resource.session_id || '',
      selectedFile: null,
    })
  }, [])

  const buildFormData = useCallback((): FormData => {
    const formData = new FormData()
    formData.append('title', form.title)
    formData.append('sharing_scope', form.scope)
    if (form.description) formData.append('description', form.description)
    if (form.contentUrl) formData.append('content_url', form.contentUrl)
    if (form.content) formData.append('content', form.content)
    // Map category to resource_type for backend compat
    formData.append('resource_type', form.category)
    formData.append('category', form.category)
    if (form.tags) formData.append('tags', form.tags)
    if (form.clientId) formData.append('client_id', form.clientId)
    if (form.sessionId) formData.append('session_id', form.sessionId)
    if (form.selectedFile) formData.append('file', form.selectedFile)
    return formData
  }, [form])

  const buildUpdateData = useCallback(() => {
    return {
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      tags: form.tags
        ? form.tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
        : [],
    }
  }, [form])

  return {
    form,
    setField,
    resetForm,
    populateForEdit,
    buildFormData,
    buildUpdateData,
    fileInputRef,
  }
}
