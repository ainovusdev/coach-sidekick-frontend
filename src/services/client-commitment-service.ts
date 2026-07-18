/**
 * Client Portal Commitment Service
 * API client for client-side commitment management
 */

import { ApiClient } from '@/lib/api-client'
import {
  Commitment,
  CommitmentAttachment,
  CommitmentUpdateCreate,
  Milestone,
  MilestoneCreate,
} from '@/types/commitment'
import authService from '@/services/auth-service'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ClientCommitmentUpdate {
  title?: string
  description?: string
  type?: 'commitment' | 'habit' | 'mp_outcome' | 'learning' | 'sprint'
  target_date?: string
  status?: 'active' | 'in_progress' | 'completed' | 'abandoned'
  progress_percentage?: number
}

export class ClientCommitmentService {
  /**
   * Update an existing commitment
   */
  static async updateCommitment(
    commitmentId: string,
    data: ClientCommitmentUpdate,
  ): Promise<Commitment> {
    const response = await ApiClient.patch(
      `${BACKEND_URL}/client-portal/commitments/${commitmentId}`,
      data,
    )
    return response
  }

  /**
   * Update progress on a commitment
   */
  static async updateProgress(
    commitmentId: string,
    data: CommitmentUpdateCreate,
  ): Promise<any> {
    const response = await ApiClient.post(
      `${BACKEND_URL}/client-portal/commitments/${commitmentId}/progress`,
      data,
    )
    return response
  }

  /**
   * Delete a commitment owned by the current client
   */
  static async deleteCommitment(commitmentId: string): Promise<void> {
    await ApiClient.delete(
      `${BACKEND_URL}/client-portal/commitments/${commitmentId}`,
    )
  }

  static async getCommitment(commitmentId: string): Promise<Commitment> {
    return ApiClient.get(
      `${BACKEND_URL}/client-portal/commitments/${commitmentId}`,
    )
  }

  static async addMilestone(
    commitmentId: string,
    data: MilestoneCreate,
  ): Promise<Milestone> {
    return ApiClient.post(
      `${BACKEND_URL}/client-portal/commitments/${commitmentId}/milestones`,
      data,
    )
  }

  static async updateMilestone(
    _commitmentId: string,
    milestoneId: string,
    data: Partial<MilestoneCreate>,
  ): Promise<Milestone> {
    return ApiClient.patch(
      `${BACKEND_URL}/client-portal/commitments/milestones/${milestoneId}`,
      data,
    )
  }

  static async deleteMilestone(
    commitmentId: string,
    milestoneId: string,
  ): Promise<void> {
    await ApiClient.delete(
      `${BACKEND_URL}/client-portal/commitments/${commitmentId}/milestones/${milestoneId}`,
    )
  }

  static async uploadAttachment(
    commitmentId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<CommitmentAttachment> {
    const token = authService.getToken()
    const formData = new FormData()
    formData.append('file', file)

    const viewAsClient =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('view_as_client_id')
        : null
    const activeClient =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('active_client_id')
        : null

    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open(
          'POST',
          `${BACKEND_URL}/client-portal/commitments/${commitmentId}/attachments`,
        )
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        if (viewAsClient) xhr.setRequestHeader('X-View-As-Client', viewAsClient)
        if (activeClient) xhr.setRequestHeader('X-Active-Client', activeClient)

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
              reject(new Error(error.detail || 'Failed to upload attachment'))
            } catch {
              reject(new Error('Upload failed'))
            }
          }
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(formData)
      })
    }

    const response = await fetch(
      `${BACKEND_URL}/client-portal/commitments/${commitmentId}/attachments`,
      {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(viewAsClient ? { 'X-View-As-Client': viewAsClient } : {}),
          ...(activeClient ? { 'X-Active-Client': activeClient } : {}),
        },
        body: formData,
      },
    )

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Upload failed' }))
      throw new Error(error.detail || 'Failed to upload attachment')
    }

    return response.json()
  }

  static async deleteAttachment(
    commitmentId: string,
    attachmentId: string,
  ): Promise<void> {
    await ApiClient.delete(
      `${BACKEND_URL}/client-portal/commitments/${commitmentId}/attachments/${attachmentId}`,
    )
  }

  static async refreshAttachmentUrl(
    commitmentId: string,
    attachmentId: string,
  ): Promise<CommitmentAttachment> {
    return ApiClient.post(
      `${BACKEND_URL}/client-portal/commitments/${commitmentId}/attachments/${attachmentId}/refresh-url`,
      {},
    )
  }
}
