'use client'

import { useState, useEffect, useMemo } from 'react'
import { isTokenValid, handleAuthExpired } from '@/lib/axios-config'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Lock,
  Save,
  Users,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator'
import { validatePassword as checkPasswordStrength } from '@/lib/password-validation'

interface ProfileData {
  id: string
  email: string
  full_name: string | null
  created_at: string
  roles: string[]
}

interface ClientInfo {
  id: string
  name: string
  email: string
  coach_id: string
  coach_name?: string | null // FIXED: Optional since may not be present
  coach_email?: string | null // FIXED: Optional
  member_since: string
}

export default function ClientProfilePage() {
  const { user, roles } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [clientInfo, setClientInfo] = useState<ClientInfo[]>([])

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  // Password strength validation
  const passwordValidation = useMemo(
    () => checkPasswordStrength(formData.new_password),
    [formData.new_password],
  )

  useEffect(() => {
    fetchProfileData()
    fetchClientInfo()
  }, [])

  const fetchProfileData = async () => {
    try {
      if (!isTokenValid()) {
        handleAuthExpired()
        return
      }
      const token = localStorage.getItem('auth_token')
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        handleAuthExpired()
        return
      }
      if (!response.ok) throw new Error('Failed to fetch profile')

      const data = await response.json()
      setProfileData(data)
      setFormData(prev => ({ ...prev, full_name: data.full_name || '' }))
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientInfo = async () => {
    try {
      if (!isTokenValid()) return
      const token = localStorage.getItem('auth_token')
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      }
      const viewAsClient = sessionStorage.getItem('view_as_client_id')
      if (viewAsClient) {
        headers['X-View-As-Client'] = viewAsClient
      }
      const activeClient = sessionStorage.getItem('active_client_id')
      if (activeClient) {
        headers['X-Active-Client'] = activeClient
      }
      const response = await fetch(`${apiUrl}/client/dashboard`, { headers })

      if (response.status === 401) {
        handleAuthExpired()
        return
      }
      if (!response.ok) return

      const data = await response.json()
      if (data.client_info) {
        setClientInfo([data.client_info])
      }
    } catch (error) {
      console.error('Error fetching client info:', error)
    }
  }

  const handleSaveProfile = async () => {
    if (!formData.full_name.trim()) {
      toast.error('Full name is required')
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem('auth_token')
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      const updateData: any = {
        full_name: formData.full_name,
      }

      // Only include password if changing
      if (formData.new_password) {
        if (!passwordValidation.isValid) {
          toast.error('Please meet all password requirements')
          setSaving(false)
          return
        }

        if (formData.new_password !== formData.confirm_password) {
          toast.error('Passwords do not match')
          setSaving(false)
          return
        }

        if (!formData.current_password) {
          toast.error('Current password is required to change password')
          setSaving(false)
          return
        }

        updateData.current_password = formData.current_password
        updateData.new_password = formData.new_password
      }

      const response = await fetch(`${apiUrl}/auth/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to update profile')
      }

      toast.success('Profile Updated!', {
        description: 'Your profile has been updated successfully.',
      })

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }))

      // Refresh profile data
      fetchProfileData()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error('Update Failed', {
        description: error.message || 'Failed to update profile',
      })
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-line border-t-ink mx-auto mb-3" />
            <p className="text-[13px] text-ink-3">Loading account…</p>
          </div>
        </div>
      </div>
    )
  }

  const initials = profileData?.full_name
    ? getInitials(profileData.full_name)
    : user?.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
      {/* Header — editorial */}
      <div className="mb-7">
        <h1 className="text-[30px] font-bold tracking-tight leading-[1.2] text-ink m-0">
          Account
        </h1>
        <p className="text-[13px] text-ink-3 mt-1.5">
          Sign-in, profile details, and how you appear to your coach.
        </p>
      </div>

      {/* Identity card */}
      <div className="bg-surface-1 border border-line rounded-[10px] shadow-sm p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-[64px] h-[64px] rounded-full bg-ink text-ink-on-dark inline-flex items-center justify-center text-[18px] font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[20px] font-semibold tracking-tight text-ink m-0 truncate">
              {profileData?.full_name || 'User'}
            </h2>
            <p className="m-0 text-[13px] text-ink-3 truncate">{user?.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {roles.map(role => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 h-[20px] px-1.5 rounded-md bg-surface-2 border border-line-2 text-ink-2 text-[10px] font-medium capitalize"
                >
                  {role === 'client' && <User className="h-3 w-3" />}
                  {role === 'coach' && <Users className="h-3 w-3" />}
                  {role === 'admin' && <Shield className="h-3 w-3" />}
                  {role.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
          {profileData?.created_at && (
            <div className="text-right flex-shrink-0 hidden sm:block">
              <p className="font-mono text-[10px] text-ink-4 uppercase tracking-[0.05em] font-semibold m-0">
                Member since
              </p>
              <p className="text-[13px] font-medium text-ink-2 m-0 mt-0.5">
                {formatDate(profileData.created_at, 'MMM yyyy')}
              </p>
            </div>
          )}
        </div>

        {clientInfo.length > 0 && (
          <div className="border-t border-line-2 mt-5 pt-4">
            <p className="font-mono text-[10px] text-ink-4 uppercase tracking-[0.05em] font-semibold m-0 mb-2">
              Your coach
            </p>
            <div className="space-y-2">
              {clientInfo.map((client, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-2 text-ink-2 inline-flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                    {(client.coach_name || 'Coach')
                      .split(' ')
                      .map(w => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink m-0 truncate">
                      {client.coach_name || 'Coach'}
                    </p>
                    <p className="text-[12px] text-ink-3 m-0 truncate">
                      {client.coach_email || 'Email not available'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile section */}
      <div className="bg-surface-1 border border-line rounded-[10px] shadow-sm p-2 mb-4">
        <h3 className="m-0 px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          Profile
        </h3>
        <div className="px-4 py-3 border-t border-line-2 space-y-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-4 font-semibold"
            >
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-4" />
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="pl-9 h-9 text-[13px] bg-surface-2 border-line text-ink-3 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-ink-4 m-0">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="full_name"
              className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-4 font-semibold"
            >
              Full name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-4" />
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
                className="pl-9 h-9 text-[13px] bg-surface-1 border-line text-ink placeholder:text-ink-4"
                placeholder="Your full name"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Password section */}
      <div className="bg-surface-1 border border-line rounded-[10px] shadow-sm p-2 mb-4">
        <h3 className="m-0 px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          Change password
        </h3>
        <div className="px-4 py-3 border-t border-line-2 space-y-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="current_password"
              className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-4 font-semibold"
            >
              Current password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-4" />
              <Input
                id="current_password"
                type={showPassword ? 'text' : 'password'}
                value={formData.current_password}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    current_password: e.target.value,
                  }))
                }
                className="pl-9 pr-9 h-9 text-[13px] bg-surface-1 border-line text-ink placeholder:text-ink-4"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="new_password"
              className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-4 font-semibold"
            >
              New password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-4" />
              <Input
                id="new_password"
                type={showPassword ? 'text' : 'password'}
                value={formData.new_password}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    new_password: e.target.value,
                  }))
                }
                className="pl-9 h-9 text-[13px] bg-surface-1 border-line text-ink placeholder:text-ink-4"
                placeholder="Create a strong password"
              />
            </div>
            {formData.new_password && (
              <div className="mt-2">
                <PasswordStrengthIndicator
                  strength={passwordValidation.strength}
                  score={passwordValidation.score}
                  showRequirements={true}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="confirm_password"
              className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-4 font-semibold"
            >
              Confirm new password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-4" />
              <Input
                id="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    confirm_password: e.target.value,
                  }))
                }
                className="pl-9 pr-9 h-9 text-[13px] bg-surface-1 border-line text-ink placeholder:text-ink-4"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          className="bg-ink text-ink-on-dark hover:bg-ink-2 h-9 px-3.5 text-[13px] font-medium"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-ink-on-dark border-t-transparent mr-2" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-2" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
