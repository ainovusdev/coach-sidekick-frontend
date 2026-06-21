'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit2,
  Save,
  X,
  UserCheck,
  Users,
  Eye,
} from 'lucide-react'
import axios from '@/lib/axios-config'
import { formatDate } from '@/lib/date-utils'
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator'
import { validatePassword as checkPasswordStrength } from '@/lib/password-validation'
import { IntegrationsSection } from './integrations-section'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
  roles: string[]
  client_access: Array<{
    client_id: string
    client_name: string
  }>
}

export function ProfileSection() {
  const { user, hasRole, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const passwordValidation = useMemo(
    () => checkPasswordStrength(formData.new_password),
    [formData.new_password],
  )

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/auth/me')
      setProfile(response.data)
      setFormData(prev => ({
        ...prev,
        full_name: response.data.full_name || '',
      }))
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

  const handleUpdateProfile = async () => {
    try {
      const updateData: any = {
        full_name: formData.full_name,
      }

      if (formData.new_password) {
        if (!passwordValidation.isValid) {
          toast({
            title: 'Error',
            description: 'Please meet all password requirements',
            variant: 'destructive',
          })
          return
        }
        if (formData.new_password !== formData.confirm_password) {
          toast({
            title: 'Error',
            description: 'Passwords do not match',
            variant: 'destructive',
          })
          return
        }
        if (!formData.current_password) {
          toast({
            title: 'Error',
            description: 'Current password is required to change password',
            variant: 'destructive',
          })
          return
        }
        updateData.current_password = formData.current_password
        updateData.new_password = formData.new_password
      }

      const response = await axios.put('/auth/me', updateData)
      setProfile(response.data)
      setIsEditing(false)
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })

      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update profile',
        variant: 'destructive',
      })
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormData({
      full_name: profile?.full_name || '',
      current_password: '',
      new_password: '',
      confirm_password: '',
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-vermillion-bg text-vermillion border-vermillion'
      case 'admin':
        return 'bg-ds-accent-bg text-ds-accent border-ds-accent'
      case 'coach':
        return 'bg-forest-bg text-forest border-forest'
      case 'viewer':
        return 'bg-surface-3 text-ink-2 border-line'
      default:
        return 'bg-surface-3 text-ink-2 border-line'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return Shield
      case 'coach':
        return UserCheck
      case 'viewer':
        return Eye
      default:
        return Users
    }
  }

  const formatRoleName = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your personal details and account settings
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleUpdateProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-ink-4" />
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-paper"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-ink-4" />
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-ink mb-3">
                Change Password
              </h3>
              <p className="text-xs text-ink-3 mb-4">
                Leave blank to keep current password
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={formData.current_password}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        current_password: e.target.value,
                      }))
                    }
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={formData.new_password}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        new_password: e.target.value,
                      }))
                    }
                    placeholder="Create a strong password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        confirm_password: e.target.value,
                      }))
                    }
                    placeholder="••••••••"
                  />
                </div>
              </div>
              {formData.new_password && (
                <div className="mt-4">
                  <PasswordStrengthIndicator
                    strength={passwordValidation.strength}
                    score={passwordValidation.score}
                    showRequirements={true}
                  />
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Account Status</Label>
                <div className="mt-1">
                  {profile?.is_active ? (
                    <Badge
                      variant="outline"
                      className="bg-forest-bg text-forest border-forest"
                    >
                      <div className="w-2 h-2 bg-forest rounded-full mr-2" />
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-vermillion-bg text-vermillion border-vermillion"
                    >
                      <div className="w-2 h-2 bg-vermillion rounded-full mr-2" />
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <Label>Member Since</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-ink-4" />
                  <span className="text-sm text-ink-2">
                    {profile?.created_at
                      ? formatDate(profile.created_at, 'MMMM d, yyyy')
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Your assigned roles and access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Assigned Roles</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile?.roles && profile.roles.length > 0 ? (
                  profile.roles.map(role => {
                    const Icon = getRoleIcon(role)
                    return (
                      <Badge
                        key={role}
                        variant="outline"
                        className={cn(
                          'flex items-center gap-1',
                          getRoleBadgeColor(role),
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {formatRoleName(role)}
                      </Badge>
                    )
                  })
                ) : (
                  <span className="text-sm text-ink-3">No roles assigned</span>
                )}
              </div>
            </div>

            {(hasRole('coach') || hasRole('trainee') || hasRole('viewer')) &&
              profile?.client_access &&
              profile.client_access.length > 0 && (
                <div className="border-t pt-4">
                  <Label>Client Access</Label>
                  <div className="mt-2 space-y-2">
                    {profile.client_access.map(access => (
                      <div
                        key={access.client_id}
                        className="flex items-center justify-between p-3 bg-paper rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-surface-3 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-ink-3" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-ink">
                              {access.client_name}
                            </p>
                            <p className="text-xs text-ink-3">
                              ID: {access.client_id}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {(hasRole('super_admin') || hasRole('admin')) && (
        <Card>
          <CardHeader>
            <CardTitle>Admin</CardTitle>
            <CardDescription>Administrative tools</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/dashboard')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Open Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      <div id="integrations" className="scroll-mt-24 space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Integrations</h2>
          <p className="text-sm text-ink-3">
            Connect external services to automate scheduling and recording.
          </p>
        </div>
        <IntegrationsSection />
      </div>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
