import authService from '@/services/auth-service'
import type { UiPreferences } from '@/types/preferences'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface PreferencesData {
  coaching_preferences: string | null
}

interface PreferencesUpdateData {
  coaching_preferences: string
}

export class PreferencesService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  static async getPreferences(): Promise<PreferencesData> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/preferences`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }

      const data: PreferencesData = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching preferences:', error)
      throw error
    }
  }

  static async updatePreferences(
    preferences: PreferencesUpdateData,
  ): Promise<PreferencesData> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/preferences`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      const data: PreferencesData = await response.json()
      return data
    } catch (error) {
      console.error('Error updating preferences:', error)
      throw error
    }
  }

  /**
   * The signed-in person's own UI settings. Plain fetch on purpose:
   * - no impersonation headers, so a super admin viewing as someone keeps
   *   (and edits) their own settings, never the person's they are viewing;
   * - no ApiClient error toast, because a missing endpoint or an expired
   *   session must not toast on every page — callers fall back to defaults.
   */
  static async getUiPreferences(): Promise<UiPreferences> {
    return this.uiPreferencesRequest('GET')
  }

  static async updateUiPreferences(
    patch: Partial<UiPreferences>,
  ): Promise<UiPreferences> {
    return this.uiPreferencesRequest('PATCH', patch)
  }

  private static async uiPreferencesRequest(
    method: 'GET' | 'PATCH',
    body?: Partial<UiPreferences>,
  ): Promise<UiPreferences> {
    const token = authService.getToken()
    if (!token) {
      throw Object.assign(new Error('Not signed in'), { status: 401 })
    }
    const response = await fetch(`${API_BASE_URL}/users/ui-preferences`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) {
      throw Object.assign(new Error('UI preferences request failed'), {
        status: response.status,
      })
    }
    return response.json()
  }
}
