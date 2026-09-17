import authService from '@/services/auth-service'
import { toast } from 'sonner'
import { captureExceptionThrottled } from '@/lib/posthog-capture'

/** Error thrown by ApiClient, annotated for PostHog dedup at the cache layer. */
type ApiError = Error & {
  status?: number
  __phCaptured?: boolean
  /** Structured `detail` object from the backend (e.g. `{ code, message, ... }`). */
  detail?: Record<string, any>
}

/**
 * True once the document has started going away.
 *
 * A request the browser kills because the page is unloading rejects with the
 * same `TypeError: Failed to fetch` a real connectivity failure gives — the
 * error carries nothing that tells the two apart. Without this flag every
 * reload, tab close or hard navigation taken while a request is still in
 * flight reports a network exception that never happened, and the slowest
 * pages produce the most of them: landing on the admin dashboard and clicking
 * through before `admin/users?limit=1000` and `client-access/matrix` finish
 * reports two.
 *
 * `pagehide` also fires when the page goes into the back/forward cache, where
 * it can be restored and keep running, so `pageshow` clears it again.
 */
let documentIsUnloading = false
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    documentIsUnloading = true
  })
  window.addEventListener('pageshow', () => {
    documentIsUnloading = false
  })
}

export class ApiClient {
  private static DEFAULT_TIMEOUT = 30000 // 30 seconds

  private static async handleErrorResponse(response: Response): Promise<never> {
    const status = response.status
    let errorMessage = `HTTP error! status: ${status}`
    let structuredDetail: Record<string, any> | undefined

    try {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json()
        const detail = errorData.detail
        if (typeof detail === 'string') {
          errorMessage = detail
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((d: any) => d.msg || String(d)).join('; ')
        } else if (detail && typeof detail === 'object') {
          structuredDetail = detail
          errorMessage = detail.message || errorData.message || errorMessage
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

    // Show toast immediately. 409 Conflict carries a structured decision for
    // the caller to present (e.g. "this person is in a group"), so it is
    // left to the caller rather than toasted generically.
    if (status !== 409) {
      showToast()
    }

    // Small delay to ensure toast is rendered
    await new Promise(resolve => setTimeout(resolve, 50))

    const error: ApiError = new Error(errorMessage)
    error.status = status
    if (structuredDetail) error.detail = structuredDetail
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
      // The page is going away; the caller is about to be torn down too.
      // Stay silent rather than reporting a failure the user never saw.
      if (documentIsUnloading) {
        ;(error as ApiError).__phCaptured = true
        throw error
      }
      console.error('Fetch error:', error)
      // These never reach a react-query onError with a usable status (the
      // request never completed), so report them here — throttled per endpoint
      // and flagged so the cache layer doesn't double-count.
      // Offline/wake flaps aren't actionable: only report failures that
      // happen while the browser believes it has a network connection.
      const isOnline = typeof navigator === 'undefined' || navigator.onLine
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: ApiError = new Error(
          'Request timeout - please try again',
        )
        timeoutError.__phCaptured = true
        if (isOnline) {
          captureExceptionThrottled(`api-timeout:${url}`, timeoutError, {
            source: 'api-client',
            reason: 'timeout',
            url,
          })
        }
        throw timeoutError
      }
      if (isOnline) {
        captureExceptionThrottled(`api-network:${url}`, error, {
          source: 'api-client',
          reason: 'network',
          url,
          visibility:
            typeof document !== 'undefined'
              ? document.visibilityState
              : 'unknown',
        })
      }
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
