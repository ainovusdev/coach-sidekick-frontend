import axios from 'axios'

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
      // NEW: Clear ALL auth data (including legacy keys)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_roles')
      localStorage.removeItem('client_access')
      localStorage.removeItem('user_email')
      localStorage.removeItem('user_full_name')
      localStorage.removeItem('user_client_id')

      // Also clear legacy keys
      localStorage.removeItem('client_auth_token')
      localStorage.removeItem('client_user_data')

      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
