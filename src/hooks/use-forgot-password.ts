import { useState, ChangeEvent, FormEvent } from 'react'

interface ForgotPasswordFormData {
  email: string
  new_password: string
  confirm_password: string
}

export function useForgotPassword(onSuccess: () => void) {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
    new_password: '',
    confirm_password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (!validatePassword(formData.new_password)) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            new_password: formData.new_password,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to reset password')
      }

      setSuccess('Password reset successfully! Redirecting to sign in...')
      setFormData({ email: '', new_password: '', confirm_password: '' })

      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return {
    formData,
    loading,
    error,
    success,
    showPassword,
    setShowPassword,
    handleInputChange,
    handleSubmit,
  }
}
