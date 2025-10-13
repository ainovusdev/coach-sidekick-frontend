/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Helper to create mock JWT token
function createMockToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  const signature = 'mock-signature'
  return `${header}.${body}.${signature}`
}

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Token Migration', () => {
    it('should migrate from client_auth_token to auth_token', () => {
      const payload = {
        sub: 'user123',
        exp: Date.now() / 1000 + 3600,
        roles: ['client'],
        client_id: 'client456',
      }
      const token = createMockToken(payload)

      localStorage.setItem('client_auth_token', token)

      // Import after setting up localStorage
      const authService = require('@/services/auth-service').default

      expect(localStorage.getItem('auth_token')).toBe(token)
      expect(localStorage.getItem('client_auth_token')).toBeNull()
    })

    it('should clean up client_user_data after migration', () => {
      const payload = {
        sub: 'user123',
        exp: Date.now() / 1000 + 3600,
        roles: ['client'],
      }
      const token = createMockToken(payload)

      localStorage.setItem('client_auth_token', token)
      localStorage.setItem(
        'client_user_data',
        JSON.stringify({ id: 'user123' }),
      )

      const authService = require('@/services/auth-service').default

      expect(localStorage.getItem('client_user_data')).toBeNull()
    })
  })

  describe('Multi-Role Support', () => {
    it('should decode token with multiple roles', () => {
      const payload = {
        sub: 'user123',
        exp: Date.now() / 1000 + 3600,
        roles: ['coach', 'client'],
        client_id: 'client456',
        client_access: ['client789'],
      }
      const token = createMockToken(payload)

      localStorage.setItem('auth_token', token)

      const authService = require('@/services/auth-service').default

      expect(authService.getRoles()).toContain('coach')
      expect(authService.getRoles()).toContain('client')
      expect(authService.isClient()).toBe(true)
      expect(authService.isCoach()).toBe(true)
      expect(authService.getOwnClientId()).toBe('client456')
      expect(authService.getClientAccess()).toContain('client789')
    })

    it('should correctly identify client role', () => {
      const payload = {
        sub: 'user123',
        exp: Date.now() / 1000 + 3600,
        roles: ['client'],
        client_id: 'client456',
      }
      const token = createMockToken(payload)

      localStorage.setItem('auth_token', token)

      const authService = require('@/services/auth-service').default

      expect(authService.isClient()).toBe(true)
      expect(authService.isCoach()).toBe(false)
      expect(authService.isAdmin()).toBe(false)
    })
  })

  describe('Logout', () => {
    it('should clear all storage keys on logout', async () => {
      localStorage.setItem('auth_token', 'token')
      localStorage.setItem('user_roles', '["coach"]')
      localStorage.setItem('client_access', '[]')
      localStorage.setItem('user_client_id', 'client123')
      localStorage.setItem('client_auth_token', 'legacy_token')

      const authService = require('@/services/auth-service').default

      await authService.logout()

      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(localStorage.getItem('user_roles')).toBeNull()
      expect(localStorage.getItem('client_access')).toBeNull()
      expect(localStorage.getItem('user_client_id')).toBeNull()
      expect(localStorage.getItem('client_auth_token')).toBeNull()
    })
  })

  describe('Client ID Management', () => {
    it('should return client_id for users with client role', () => {
      const payload = {
        sub: 'user123',
        exp: Date.now() / 1000 + 3600,
        roles: ['client'],
        client_id: 'client456',
      }
      const token = createMockToken(payload)

      localStorage.setItem('auth_token', token)

      const authService = require('@/services/auth-service').default

      expect(authService.getOwnClientId()).toBe('client456')
    })

    it('should return null for users without client_id', () => {
      const payload = {
        sub: 'user123',
        exp: Date.now() / 1000 + 3600,
        roles: ['coach'],
      }
      const token = createMockToken(payload)

      localStorage.setItem('auth_token', token)

      const authService = require('@/services/auth-service').default

      expect(authService.getOwnClientId()).toBeNull()
    })
  })

  describe('Token Expiry', () => {
    it('should detect expired tokens', () => {
      const payload = {
        sub: 'user123',
        exp: Date.now() / 1000 - 3600, // Expired 1 hour ago
        roles: ['coach'],
      }
      const token = createMockToken(payload)

      localStorage.setItem('auth_token', token)

      const authService = require('@/services/auth-service').default

      expect(authService.isAuthenticated()).toBe(false)
    })

    it('should accept valid tokens', () => {
      const payload = {
        sub: 'user123',
        exp: Date.now() / 1000 + 3600, // Expires in 1 hour
        roles: ['coach'],
      }
      const token = createMockToken(payload)

      localStorage.setItem('auth_token', token)

      const authService = require('@/services/auth-service').default

      expect(authService.isAuthenticated()).toBe(true)
    })
  })
})
