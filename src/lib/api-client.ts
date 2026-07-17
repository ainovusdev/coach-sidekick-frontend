import authService from '@/services/auth-service'
import { toast } from 'sonner'
import { captureExceptionThrottled } from '@/lib/posthog-capture'

/** Error thrown by ApiClient, annotated for PostHog dedup at the cache layer. */
type ApiError = Error & { status?: number; __phCaptured?: boolean }

export class ApiClient {
  private static DEFAULT_TIMEOUT = 30000 // 30 seconds

  private static async handleErrorResponse(response: Response): Promise<never> {
    const status = response.status
    let errorMessage = `HTTP error! status: ${status}`

    try {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json()
        const detail = errorData.detail
        if (typeof detail === 'string') {
          errorMessage = detail
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((d: any) => d.msg || String(d)).join('; ')
        } else {
          errorMessage = errorData.message || errorMessage
        }
      } else {
        const errorText = await response.text()
        // Try to parse as JSON if it looks like JSON
        if (errorText.startsWith('{')) {
          try {
            const errorData = JSON.parse(errorText)
            const det = errorData.detail
            if (typeof det === 'string') {
              errorMessage = det
            } else if (Array.isArray(det)) {
              errorMessage = det.map((d: any) => d.msg || String(d)).join('; ')
            } else {
              errorMessage = errorData.message || errorText
            }
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

    // Show toast notification for user-friendly errors
    // Use setTimeout to ensure toast is rendered before error is thrown
    const showToast = () => {
      if (response.status === 403) {
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

    const error: ApiError = new Error(errorMessage)
    error.status = status
    // Report server errors to PostHog here (throttled per endpoint+status so a
    // retried call doesn't double-report) and flag them so the react-query
    // cache layer skips re-reporting. Routine 4xx are expected user/flow errors
    // and are intentionally left uncaptured.
    if (status >= 500) {
      captureExceptionThrottled(`api-5xx:${status}:${response.url}`, error, {
        source: 'api-client',
        status,
        url: response.url,
      })
      error.__phCaptured = true
    }
    throw error
  }

  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = authService.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Impersonation headers
    if (typeof window !== 'undefined') {
      const viewAsClient = sessionStorage.getItem('view_as_client_id')
      if (viewAsClient) {
        headers['X-View-As-Client'] = viewAsClient
      }
      const viewAsCoach = sessionStorage.getItem('view_as_coach_id')
      if (viewAsCoach) {
        headers['X-View-As-Coach'] = viewAsCoach
      }
      // Multi-profile switch (Phase 5c): a client choosing among their OWN
      // profiles. Distinct from impersonation above — the backend honors it only
      // on the no-impersonation path.
      const activeClient = sessionStorage.getItem('active_client_id')
      if (activeClient) {
        headers['X-Active-Client'] = activeClient
      }
    }

    return headers
  }

  private static async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = this.DEFAULT_TIMEOUT,
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(new Error('Request timeout')),
      timeout,
    )

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
      // These never reach a react-query onError with a usable status (the
      // request never completed), so report them here — throttled per endpoint
      // and flagged so the cache layer doesn't double-count.
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: ApiError = new Error(
          'Request timeout - please try again',
        )
        timeoutError.__phCaptured = true
        captureExceptionThrottled(`api-timeout:${url}`, timeoutError, {
          source: 'api-client',
          reason: 'timeout',
          url,
        })
        throw timeoutError
      }
      captureExceptionThrottled(`api-network:${url}`, error, {
        source: 'api-client',
        reason: 'network',
        url,
      })
      ;(error as ApiError).__phCaptured = true
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

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers,
      },
      timeout,
    )

    if (!response.ok) {
      await this.handleErrorResponse(response)
    }

    return await response.json()
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
