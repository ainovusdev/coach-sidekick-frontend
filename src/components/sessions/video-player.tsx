'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, RefreshCw, AlertCircle, Loader2, VideoOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  videoUrl: string | null | undefined
  sessionId: string
  onRefresh: () => Promise<void>
  className?: string
}

export function VideoPlayer({
  videoUrl,
  sessionId: _sessionId,
  onRefresh,
  className,
}: VideoPlayerProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleVideoError = () => {
    setError(true)
    setLoading(false)
  }

  const handleVideoLoad = () => {
    setLoading(false)
    setError(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setError(false)
    try {
      await onRefresh()
      // After refresh, reset loading state to show video again
      setLoading(true)
    } catch (err) {
      console.error('Failed to refresh video URL:', err)
      setError(true)
    } finally {
      setRefreshing(false)
    }
  }

  // No video URL available
  if (!videoUrl) {
    return (
      <Card className={cn('border-gray-200', className)}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5" />
            Session Recording
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <VideoOff className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Recording Available
            </h3>
            <p className="text-gray-500 max-w-md">
              This session does not have a video recording. Recordings are only
              available for sessions conducted with the meeting bot.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state (expired URL or other error)
  if (error && !refreshing) {
    return (
      <Card className={cn('border-gray-200', className)}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5" />
            Session Recording
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Video URL Expired
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              The video link has expired. Click the button below to get a fresh
              link.
            </p>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Video Link
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-gray-200', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5" />
            Session Recording
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-gray-300 hover:bg-gray-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg overflow-hidden bg-black">
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                <p className="text-white text-sm">Loading video...</p>
              </div>
            </div>
          )}

          {/* Video element */}
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            controlsList="nodownload"
            className="w-full aspect-video"
            onError={handleVideoError}
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoLoad}
            preload="metadata"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Video links expire periodically. If playback fails, click the refresh
          button to get a new link.
        </p>
      </CardContent>
    </Card>
  )
}
