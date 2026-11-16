/**
 * Client Portal Resource Service
 * API client for client-side resource access
 */

import { ApiClient } from '@/lib/api-client'
import authService from '@/services/auth-service'
import type {
  ClientUploadUpdate,
  ClientResource,
  ClientResourceListResponse,
  ClientResourceFilters,
} from '@/types/resource'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export class ClientResourceService {
  static async listResources(
    filters?: ClientResourceFilters,
  ): Promise<ClientResourceListResponse> {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.session_id) params.append('session_id', filters.session_id)
    if (filters?.source) params.append('source', filters.source)
    if (filters?.skip !== undefined) params.append('skip', String(filters.skip))
    if (filters?.limit !== undefined)
      params.append('limit', String(filters.limit))
    const query = params.toString()
    return ApiClient.get(
      `${BACKEND_URL}/client-portal/resources${query ? `?${query}` : ''}`,
    )
  }

  static async getResource(id: string): Promise<ClientResource> {
    return ApiClient.get(`${BACKEND_URL}/client-portal/resources/${id}`)
  }

  static async trackDownload(id: string): Promise<void> {
    return ApiClient.post(
      `${BACKEND_URL}/client-portal/resources/${id}/download`,
      {},
    )
  }

  /**
   * Upload a file or link to the active profile. Raw XHR (multipart + progress),
   * so the impersonation / profile headers are added by hand.
   */
  static uploadResource(
    formData: FormData,
    onProgress?: (percent: number) => void,
  ): Promise<ClientResource> {
    const token = authService.getToken()
    const viewAsClient =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('view_as_client_id')
        : null
    const activeClient =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('active_client_id')
        : null

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${BACKEND_URL}/client-portal/resources`)
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      if (viewAsClient) xhr.setRequestHeader('X-View-As-Client', viewAsClient)
      if (activeClient) xhr.setRequestHeader('X-Active-Client', activeClient)

      xhr.upload.onprogress = e => {
        if (onProgress && e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
          return
        }
        let message = 'Upload failed'
        try {
          const body = JSON.parse(xhr.responseText)
          if (typeof body.detail === 'string') message = body.detail
        } catch {
          // keep the generic message
        }
        const err = new Error(message) as Error & { status?: number }
        err.status = xhr.status
        reject(err)
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(formData)
    })
  }

  static async updateResource(
    id: string,
    data: ClientUploadUpdate,
  ): Promise<ClientResource> {
    return ApiClient.patch(`${BACKEND_URL}/client-portal/resources/${id}`, data)
  }

  static async deleteResource(id: string): Promise<void> {
    return ApiClient.delete(`${BACKEND_URL}/client-portal/resources/${id}`)
  }
}
