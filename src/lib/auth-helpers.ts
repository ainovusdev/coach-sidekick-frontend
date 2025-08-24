import { NextRequest } from 'next/server'
import axios from 'axios'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export async function verifyAuth(
  request: NextRequest,
): Promise<AuthUser | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)

    // Verify token with backend
    const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 200 && response.data.user) {
      return response.data.user
    }

    return null
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

export function requireAuth(user: AuthUser | null): asserts user is AuthUser {
  if (!user) {
    throw new Error('Authentication required')
  }
}
