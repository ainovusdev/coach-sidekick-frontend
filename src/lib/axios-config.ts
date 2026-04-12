import axios from 'axios'

/**
 * Check if the stored JWT token is present and not expired.
 * Used by both axios interceptor and raw fetch() callers to avoid
 * sending requests with expired tokens (which generate 401 noise).
 */
export function isTokenValid(): boolean {
  if (typeof window === 'undefined') return false
  const token =
    localStorage.getItem('auth_token') ||
    localStorage.getItem('client_auth_token')
  if (!token) return false
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return decoded.exp > Date.now() / 1000
  } catch {
    return false
  }
}

/**
 * Clear all auth data and redirect to login.
 * Shared between axios interceptor and raw fetch() callers.
 */
export function handleAuthExpired() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_roles')
  localStorage.removeItem('client_access')
  localStorage.removeItem('user_email')
  localStorage.removeItem('user_full_name')
  localStorage.removeItem('user_client_id')
  localStorage.removeItem('client_auth_token')
  localStorage.removeItem('client_user_data')
  window.location.href = '/auth'
}

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  config => {
    // Don't add token for auth endpoints
    const isAuthEndpoint =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register')

    if (!isAuthEndpoint) {
      // NEW: Support both tokens during migration, prioritize auth_token
      const token =
        localStorage.getItem('auth_token') ||
        localStorage.getItem('client_auth_token')

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // Impersonation headers
    if (typeof window !== 'undefined') {
      const viewAsClient = sessionStorage.getItem('view_as_client_id')
      if (viewAsClient) {
        config.headers['X-View-As-Client'] = viewAsClient
      }
      const viewAsCoach = sessionStorage.getItem('view_as_coach_id')
      if (viewAsCoach && !config.url?.includes('/admin/')) {
        config.headers['X-View-As-Coach'] = viewAsCoach
      }
    }

    return config
  },
  error => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      handleAuthExpired()
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
