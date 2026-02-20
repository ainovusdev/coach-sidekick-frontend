'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Lock,
  Save,
  Users,
  Calendar,
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
      const token = localStorage.getItem('auth_token')
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

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
      const token = localStorage.getItem('auth_token')
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      const response = await fetch(`${apiUrl}/client/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

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
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 bg-white border-4 border-gray-200 mb-4">
                  <AvatarFallback className="bg-white text-black text-2xl font-bold">
                    {profileData?.full_name
                      ? getInitials(profileData.full_name)
                      : user?.email?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {profileData?.full_name || 'User'}
                </h2>
                <p className="text-gray-600 text-sm mb-4">{user?.email}</p>

                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {roles.map(role => (
                    <Badge
                      key={role}
                      variant="outline"
                      className="bg-gray-50 border-gray-300 text-gray-700"
                    >
                      {role === 'client' && <User className="h-3 w-3 mr-1" />}
                      {role === 'coach' && <Users className="h-3 w-3 mr-1" />}
                      {role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                      {role.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>

                {profileData?.created_at && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Member since{' '}
                    {formatDate(profileData.created_at, 'MMMM yyyy')}
                  </div>
                )}
              </div>

              <Separator className="my-6 bg-gray-50" />

              {/* Coaches List */}
              {clientInfo.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Your Coaches
                  </h3>
                  <div className="space-y-3">
                    {clientInfo.map((client, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-300"
                      >
                        <Users className="h-5 w-5 text-gray-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {client.coach_name || 'Coach'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {client.coach_email || 'Email not available'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">
                Personal Information
              </CardTitle>
              <CardDescription className="text-gray-600">
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-gray-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
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
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Change Password</CardTitle>
              <CardDescription className="text-gray-600">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password" className="text-gray-700">
                  Current Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
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
                    className="pl-10 pr-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-gray-700">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
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
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
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

              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-gray-700">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
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
                    className="pl-10 pr-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-white text-black hover:bg-zinc-200"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
