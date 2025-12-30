'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  UserPlus,
  LogIn,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import Image from 'next/image'
import { ForgotPasswordRequest } from './forgot-password-request'
import { PasswordStrengthIndicator } from './password-strength-indicator'
import { validatePassword as checkPasswordStrength } from '@/lib/password-validation'

export function AuthForm() {
  const { signIn, signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('signin')
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Password strength validation for signup
  const passwordValidation = useMemo(
    () => checkPasswordStrength(formData.password),
    [formData.password],
  )

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // For sign in, we just check if password exists (backend validates)
  const validateSignInPassword = (password: string) => {
    return password.length >= 1
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (!validateSignInPassword(formData.password)) {
      setError('Please enter your password')
      setLoading(false)
      return
    }

    const { error } = await signIn(formData.email, formData.password)

    if (error) {
      setError(error.message)
    }

    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (!passwordValidation.isValid) {
      setError('Please meet all password requirements')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { error } = await signUp(formData.email, formData.password)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Account created successfully! You can now sign in.')
      setFormData({ email: formData.email, password: '', confirmPassword: '' })
      // Switch to sign in tab after successful signup
      setTimeout(() => {
        setActiveTab('signin')
      }, 2000)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-gray-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />

      {/* Main Content */}
      <div className="relative w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gray-900 rounded-xl blur-lg opacity-20"></div>
              <div className="relative w-14 h-14 bg-gray-900 rounded-xl p-2 flex items-center justify-center">
                <Image
                  src="/novus-global-logo.webp"
                  alt="Novus Global Logo"
                  width={40}
                  height={40}
                  className="object-contain filter brightness-0 invert"
                />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                Coach Sidekick
              </h1>
              <div className="flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-gray-600" />
                <span className="text-xs font-medium text-gray-600">
                  AI-Powered Coaching Assistant
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Card or Forgot Password Form */}
        {showForgotPassword ? (
          <ForgotPasswordRequest onBack={() => setShowForgotPassword(false)} />
        ) : (
          <Card className="border-gray-200 shadow-xl bg-white/95 backdrop-blur">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-xl font-bold text-gray-900">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                Sign in to your Coach Sidekick account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger
                    value="signin"
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
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
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="text-sm font-medium text-gray-700"
                        >
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-gray-600 hover:text-gray-900"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={formData.password}
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
                          Signing in...
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">
                          Or continue with
                        </span>
                      </div>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="signup-email"
                        className="text-sm font-medium text-gray-700"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="signup-email"
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
                        htmlFor="signup-password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="signup-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          value={formData.password}
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
                      {formData.password && (
                        <PasswordStrengthIndicator
                          strength={passwordValidation.strength}
                          score={passwordValidation.score}
                          showRequirements={true}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="confirm-password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="confirm-password"
                          name="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
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
                          Creating account...
                        </div>
                      ) : (
                        'Create Account'
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      By signing up, you agree to our{' '}
                      <a href="#" className="text-gray-900 hover:underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-gray-900 hover:underline">
                        Privacy Policy
                      </a>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2024 Coach Sidekick. Powered by Novus Global.
          </p>
        </div>
      </div>
    </div>
  )
}
