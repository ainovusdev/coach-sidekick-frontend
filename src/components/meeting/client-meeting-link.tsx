/**
 * Client Meeting Link Component
 * Compact button to copy shareable client link
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Link2, Copy, Check, UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  LiveMeetingService,
  LiveMeetingTokenInfo,
} from '@/services/live-meeting-service'

interface ClientMeetingLinkProps {
  sessionId: string | null
  clientId: string | null
  clientName?: string | null
}

export function ClientMeetingLink({
  sessionId,
  clientId,
  clientName,
}: ClientMeetingLinkProps) {
  const [tokenInfo, setTokenInfo] = useState<LiveMeetingTokenInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch token when session has a client
  useEffect(() => {
    if (!sessionId || !clientId) {
      setTokenInfo(null)
      setError(null)
      return
    }

    const fetchToken = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await LiveMeetingService.getOrCreateToken(sessionId)
        setTokenInfo(data)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to get link'
        setError(message)
        console.error('Failed to fetch client meeting token:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchToken()
  }, [sessionId, clientId])

  const handleCopy = async () => {
    if (!tokenInfo) return

    try {
      await navigator.clipboard.writeText(tokenInfo.share_url)
      setHasCopied(true)
      toast.success('Client link copied to clipboard')
      setTimeout(() => setHasCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  // No client assigned - show disabled state
  if (!clientId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="text-gray-400"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Share with Client
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Assign a client to this session first</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Loading
  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  // Error
  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Link Error
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // No token yet
  if (!tokenInfo) {
    return null
  }

  // Ready to copy
  const displayName = tokenInfo.client_name || clientName || 'Client'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={hasCopied ? 'border-green-300 text-green-600' : ''}
          >
            {hasCopied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Share with {displayName}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs font-mono break-all">{tokenInfo.share_url}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
