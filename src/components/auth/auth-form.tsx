'use client'

import { useState } from 'react'
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
import { Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { ForgotPasswordRequest } from './forgot-password-request'

export function AuthForm() {
  // Account creation is invite-only (coach-signup / client-signup with a token),
  // so this form is sign-in only. Public self-registration was removed because it
  // created accounts with no role, stranding users at the client-portal gate.
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-app-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-app-accent/[0.07] blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] left-[60%] w-[300px] h-[300px] rounded-full bg-app-accent/[0.03] blur-[80px] pointer-events-none" />

      {/* Main Content */}
      <div className="relative w-full max-w-[420px] z-10">
        {/* Logo and Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3.5 mb-3">
            <div className="relative">
              <div className="absolute -inset-1.5 bg-app-accent/20 rounded-2xl blur-lg" />
              <div className="relative w-14 h-14 bg-app-primary rounded-2xl p-2 flex items-center justify-center shadow-lg ring-1 ring-paper/10">
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
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Coach Sidekick
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-app-accent" />
                <span className="text-xs font-medium text-muted-foreground">
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
          <Card className="border-border/60 shadow-xl shadow-black/[0.04] dark:shadow-black/20 bg-card/80 backdrop-blur-xl">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-center text-xl font-bold text-card-foreground">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-center">
                Sign in to your Coach Sidekick account
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground/80"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 border-input focus:border-app-accent focus:ring-app-accent/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground/80"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-medium text-app-accent hover:text-app-accent/80 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 border-input focus:border-app-accent focus:ring-app-accent/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  <div className="flex items-start gap-2 text-vermillion text-sm bg-vermillion-bg p-3 rounded-lg border border-vermillion ">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-app-accent hover:bg-app-accent/90 text-ink-on-dark font-medium py-2.5 shadow-md shadow-app-accent/20 transition-all duration-200 hover:shadow-lg hover:shadow-app-accent/25"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-paper border-t-transparent" />
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Coach Sidekick. Powered by Novus Global.
          </p>
        </div>
      </div>
    </div>
  )
}
