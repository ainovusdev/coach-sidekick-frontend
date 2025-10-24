import authService from '@/services/auth-service'
import { toast } from 'sonner'

export class ApiClient {
  private static DEFAULT_TIMEOUT = 30000 // 30 seconds

  private static async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP error! status: ${response.status}`

    try {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } else {
        const errorText = await response.text()
        // Try to parse as JSON if it looks like JSON
        if (errorText.startsWith('{')) {
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.detail || errorData.message || errorText
          } catch {
            errorMessage = errorText || errorMessage
          }
        } else {
          errorMessage = errorText || errorMessage
        }
      }
    } catch (e) {
      console.error('Error parsing error response:', e)
    }

    console.log('API Error:', response.status, errorMessage)

    // Show toast notification for user-friendly errors
    // Use setTimeout to ensure toast is rendered before error is thrown
    const showToast = () => {
      if (response.status === 403) {
        console.log('Showing 403 toast:', errorMessage)
        toast.error('Access Denied', {
          description: errorMessage,
          duration: 5000,
        })
      } else if (response.status === 404) {
        toast.error('Not Found', {
          description: errorMessage,
          duration: 5000,
        })
      } else if (response.status === 400) {
        toast.error('Invalid Request', {
          description: errorMessage,
          duration: 5000,
        })
      } else if (response.status === 401) {
        toast.error('Authentication Required', {
          description: 'Please log in to continue',
          duration: 5000,
        })
      } else if (response.status >= 500) {
        toast.error('Server Error', {
          description:
            'Something went wrong on the server. Please try again later.',
          duration: 5000,
        })
      } else {
        toast.error('Request Failed', {
          description: errorMessage,
          duration: 5000,
        })
      }
    }

    // Show toast immediately
    showToast()

    // Small delay to ensure toast is rendered
    await new Promise(resolve => setTimeout(resolve, 50))

    throw new Error(errorMessage)
  }

  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = authService.getToken()
    console.log(
      'Auth token retrieved:',
      token ? `${token.substring(0, 20)}...` : 'No token',
    )
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private static async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = this.DEFAULT_TIMEOUT,
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // make sure url doesn't have ? at the end
    const endpointWithoutTrailingQuestionMark = url.endsWith('?')
      ? url.replace(/\?.*$/, '/')
      : url

    try {
      const response = await fetch(endpointWithoutTrailingQuestionMark, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      // Handle 401 responses
      if (response.status === 401) {
        console.error('Authentication failed - 401 response')
        // Since refreshAccessToken doesn't exist, we'll just return the 401 response
        // The error handling will redirect to login
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('Fetch error:', error)
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
      timeout,
    )

    if (!response.ok) {
      await this.handleErrorResponse(response)
    }

    return await response.json()
  }

  static async get(url: string, timeout?: number) {
    const headers = await this.getAuthHeaders()
    console.log('GET request to:', url)
    console.log('Request headers:', headers)

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers,
      },
      timeout,
    )

    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)

    if (!response.ok) {
      await this.handleErrorResponse(response)
    }

    const data = await response.json()
    console.log('Response data:', data)
    return data
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
      timeout,
    )

    if (!response.ok) {
      await this.handleErrorResponse(response)
    }

    return await response.json()
  }

  static async patch(url: string, data: any, timeout?: number) {
    const headers = await this.getAuthHeaders()

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      },
      timeout,
    )

    if (!response.ok) {
      await this.handleErrorResponse(response)
    }

    return await response.json()
  }

  static async delete(url: string, timeout?: number) {
    const headers = await this.getAuthHeaders()

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'DELETE',
        headers,
      },
      timeout,
    )

    if (!response.ok) {
      await this.handleErrorResponse(response)
    }

    // DELETE typically returns no content
    if (response.status === 204) {
      return null
    }

    return await response.json()
  }
}
