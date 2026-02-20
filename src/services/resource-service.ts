/**
 * Coach-side Resource Service
 * API client for resource management (CRUD, sharing)
 */

import { ApiClient } from '@/lib/api-client'
import authService from '@/services/auth-service'
import type {
  SharedResource,
  SharedResourceListResponse,
  SharedResourceUpdate,
  ResourceShareRequest,
  ResourceFilters,
  CategoryOption,
} from '@/types/resource'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export class ResourceService {
  static async createResource(
    formData: FormData,
    onProgress?: (percent: number) => void,
  ): Promise<SharedResource> {
    const token = authService.getToken()

    // Use XHR when progress tracking is needed (file uploads)
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${BACKEND_URL}/resources/`)
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            try {
              const error = JSON.parse(xhr.responseText)
              reject(new Error(error.detail || 'Failed to create resource'))
            } catch {
              reject(new Error('Upload failed'))
            }
          }
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(formData)
      })
    }

    const response = await fetch(`${BACKEND_URL}/resources/`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Upload failed' }))
      throw new Error(error.detail || 'Failed to create resource')
    }

    return response.json()
  }

  static async listResources(
    filters?: ResourceFilters,
  ): Promise<SharedResourceListResponse> {
    const params = new URLSearchParams()
    if (filters?.scope) params.append('scope', filters.scope)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.client_id) params.append('client_id', filters.client_id)
    if (filters?.session_id) params.append('session_id', filters.session_id)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.skip !== undefined) params.append('skip', String(filters.skip))
    if (filters?.limit !== undefined)
      params.append('limit', String(filters.limit))
    const query = params.toString()
    return ApiClient.get(`${BACKEND_URL}/resources/${query ? `?${query}` : ''}`)
  }

  static async getResource(id: string): Promise<SharedResource> {
    return ApiClient.get(`${BACKEND_URL}/resources/${id}`)
  }

  static async updateResource(
    id: string,
    data: SharedResourceUpdate,
  ): Promise<SharedResource> {
    return ApiClient.patch(`${BACKEND_URL}/resources/${id}`, data)
  }

  static async deleteResource(id: string): Promise<void> {
    return ApiClient.delete(`${BACKEND_URL}/resources/${id}`)
  }

  static async shareResource(
    id: string,
    data: ResourceShareRequest,
  ): Promise<SharedResource> {
    return ApiClient.post(`${BACKEND_URL}/resources/${id}/share`, data)
  }

  static async getCategories(): Promise<CategoryOption[]> {
    return ApiClient.get(`${BACKEND_URL}/resources/categories`)
  }
}
