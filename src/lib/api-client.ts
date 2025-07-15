import { supabase } from './supabase'

export class ApiClient {
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

  static async post(url: string, data: any) {
    const headers = await this.getAuthHeaders()

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    return response
  }

  static async get(url: string) {
    const headers = await this.getAuthHeaders()

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    return response
  }

  static async put(url: string, data: any) {
    const headers = await this.getAuthHeaders()

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })

    return response
  }

  static async delete(url: string) {
    const headers = await this.getAuthHeaders()

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    })

    return response
  }
}
