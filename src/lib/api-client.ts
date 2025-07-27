import { supabase } from './supabase'

export class ApiClient {
  private static DEFAULT_TIMEOUT = 30000 // 30 seconds

  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    return headers
  }

  private static async fetchWithTimeout(url: string, options: RequestInit, timeout: number = this.DEFAULT_TIMEOUT): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again')
      }
      throw error
    }
  }

  static async post(url: string, data: any, timeout?: number) {
    const headers = await this.getAuthHeaders()

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      },
      timeout
    )

    return response
  }

  static async get(url: string, timeout?: number) {
    const headers = await this.getAuthHeaders()

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers,
      },
      timeout
    )

    return response
  }

  static async put(url: string, data: any, timeout?: number) {
    const headers = await this.getAuthHeaders()

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      },
      timeout
    )

    return response
  }

  static async delete(url: string, timeout?: number) {
    const headers = await this.getAuthHeaders()

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'DELETE',
        headers,
      },
      timeout
    )

    return response
  }
}
