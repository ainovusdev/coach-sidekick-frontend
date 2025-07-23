'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Client } from '@/types/meeting'
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  FileText,
  Tag,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Save,
  ArrowLeft,
} from 'lucide-react'

interface ClientFormProps {
  client?: Client
  onSubmit: (data: Partial<Client>) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function ClientForm({
  client,
  onSubmit,
  onCancel,
  isLoading = false,
}: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    company: client?.company || '',
    position: client?.position || '',
    notes: client?.notes || '',
    tags: client?.tags || [],
    status: client?.status || 'active',
  })

  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset errors
    setErrors({})

    // Validate required fields
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required'
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        position: formData.position.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags,
        status: formData.status as 'active' | 'inactive' | 'archived',
      })
    } catch (error) {
      console.error('Error submitting client form:', error)
    }
  }

  const addTag = () => {
    const tag = newTag.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          icon: '🟢',
        }
      case 'inactive':
        return {
          color: 'text-slate-700 bg-slate-50 border-slate-200',
          icon: '⏸️',
        }
      case 'archived':
        return { color: 'text-red-700 bg-red-50 border-red-200', icon: '📁' }
      default:
        return {
          color: 'text-slate-700 bg-slate-50 border-slate-200',
          icon: '❓',
        }
    }
  }

  const statusConfig = getStatusConfig(formData.status)

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-200">
          <CardTitle className="flex items-center gap-3 text-slate-800">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {client ? 'Edit Client Profile' : 'Create New Client'}
              </h2>
              <p className="text-sm text-slate-600 font-normal mt-1">
                {client
                  ? `Update ${client.name}'s information`
                  : 'Add a new coaching client to your roster'}
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <User className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Basic Information
                </h3>
              </div>

              {/* Name - Required */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Full Name *
                </label>
                <div className="relative">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleFieldChange('name', e.target.value)}
                    className={`pl-10 ${
                      errors.name
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'
                    }`}
                    placeholder="Enter client's full name"
                  />
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  {touched.name && !errors.name && formData.name && (
                    <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                  )}
                </div>
                {errors.name && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => handleFieldChange('email', e.target.value)}
                    className={`pl-10 ${
                      errors.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'
                    }`}
                    placeholder="client@example.com"
                  />
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  {touched.email && !errors.email && formData.email && (
                    <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                  )}
                </div>
                {errors.email && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={e => handleFieldChange('phone', e.target.value)}
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-200"
                    placeholder="+1 (555) 123-4567"
                  />
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Building className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Professional Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company */}
                <div className="space-y-2">
                  <label
                    htmlFor="company"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Company
                  </label>
                  <div className="relative">
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={e =>
                        handleFieldChange('company', e.target.value)
                      }
                      className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-200"
                      placeholder="Company name"
                    />
                    <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <label
                    htmlFor="position"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Position/Title
                  </label>
                  <div className="relative">
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={e =>
                        handleFieldChange('position', e.target.value)
                      }
                      className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-200"
                      placeholder="Job title"
                    />
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Tags Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Tag className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Status & Tags
                </h3>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label
                  htmlFor="status"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Client Status
                </label>
                <div className="relative">
                  <select
                    id="status"
                    value={formData.status}
                    onChange={e => handleFieldChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
                  >
                    <option value="active">🟢 Active</option>
                    <option value="inactive">⏸️ Inactive</option>
                    <option value="archived">📁 Archived</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge
                    className={`${statusConfig.color} border text-xs font-medium`}
                  >
                    {statusConfig.icon}{' '}
                    {formData.status.charAt(0).toUpperCase() +
                      formData.status.slice(1)}
                  </Badge>
                  <span className="text-slate-500">Current status</span>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label
                  htmlFor="tags"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Tags
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="tags"
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a tag and press Enter"
                      className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-200"
                    />
                    <Tag className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    size="sm"
                    className="px-4 border-slate-300 hover:bg-slate-50"
                    disabled={!newTag.trim()}
                  >
                    Add
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100 transition-colors flex items-center gap-1 text-slate-700 border-slate-300"
                        onClick={() => removeTag(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <FileText className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Additional Notes
                </h3>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="notes"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => handleFieldChange('notes', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 min-h-[120px] resize-y"
                  placeholder="Additional notes about the client, coaching goals, preferences, etc..."
                />
                <p className="text-xs text-slate-500">
                  Add any relevant information that will help with coaching
                  sessions
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-50"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-1 sm:flex-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {client ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {client ? 'Update Client' : 'Create Client'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
