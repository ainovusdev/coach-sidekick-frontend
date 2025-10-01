'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useForgotPassword } from '@/hooks/use-forgot-password'

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const {
    formData,
    loading,
    error,
    success,
    showPassword,
    setShowPassword,
    handleInputChange,
    handleSubmit,
  } = useForgotPassword(onBack)

  return (
    <Card className="border-gray-200 shadow-xl bg-white/95 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <CardTitle className="text-xl font-bold text-gray-900">
            Reset Password
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600">
          Enter your email and new password to reset your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="new_password"
              className="text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="new_password"
                name="new_password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={formData.new_password}
                onChange={handleInputChange}
                className="pl-10 pr-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Use 6 or more characters with a mix of letters, numbers & symbols
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirm_password"
              className="text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="confirm_password"
                name="confirm_password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                className="pl-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Resetting password...
              </div>
            ) : (
              'Reset Password'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to sign in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
