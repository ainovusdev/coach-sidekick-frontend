'use client'

import { useState } from 'react'
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
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface ForgotPasswordRequestProps {
  onBack?: () => void
}

export function ForgotPasswordRequest({ onBack }: ForgotPasswordRequestProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/request-password-reset`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase() }),
        },
      )

      await response.json()

      if (!response.ok && response.status !== 410) {
        // Don't show specific error messages for security
        throw new Error('Failed to process request. Please try again.')
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Password reset request error:', err)
      setError('Something went wrong. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Check Your Email</CardTitle>
              <CardDescription className="text-green-700 dark:text-green-400">
                Password reset instructions sent
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If an account exists with{' '}
            <strong className="text-foreground">{email}</strong>, you will
            receive password reset instructions within a few minutes.
          </p>

          <div className="bg-card rounded-lg p-4 border border-green-200 dark:border-green-900/50">
            <h4 className="font-medium text-sm text-foreground mb-2">
              Next steps:
            </h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Check your email inbox</li>
              <li>Look for an email from Coach Sidekick</li>
              <li>Click the reset link in the email</li>
              <li>Create your new password</li>
            </ol>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>&bull; The reset link will expire in 1 hour</p>
            <p>&bull; Didn&apos;t receive an email? Check your spam folder</p>
            <p>&bull; Still having issues? Try again in a few minutes</p>
          </div>

          {onBack && (
            <Button variant="outline" onClick={onBack} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 shadow-xl shadow-black/[0.04] dark:shadow-black/20 bg-card/80 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          {onBack && (
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <CardTitle className="text-xl font-bold text-card-foreground">
            Forgot Password?
          </CardTitle>
        </div>
        <CardDescription>
          No worries! Enter your email and we&apos;ll send you reset
          instructions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10 border-input focus:border-app-accent focus:ring-app-accent/20"
                disabled={loading}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the email address associated with your account
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-app-accent hover:bg-app-accent/90 text-white font-medium py-2.5 shadow-md shadow-app-accent/20 transition-all duration-200 hover:shadow-lg hover:shadow-app-accent/25"
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Instructions...
              </>
            ) : (
              'Send Reset Instructions'
            )}
          </Button>

          {onBack && (
            <div className="text-center">
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-app-accent hover:text-app-accent/80 hover:underline transition-colors"
              >
                Back to sign in
              </button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
