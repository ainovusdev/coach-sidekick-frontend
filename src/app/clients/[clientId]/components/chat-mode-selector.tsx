'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  MessageSquare,
  Headphones,
  Sparkles,
  Zap,
  Info,
  DollarSign,
} from 'lucide-react'
import { ClientChatWidget } from './client-chat-widget'
import { ClientChatRealtime } from './client-chat-realtime'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ChatModeSelectorProps {
  clientId: string
  clientName?: string
}

export function ChatModeSelector({
  clientId,
  clientName,
}: ChatModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<
    'classic' | 'realtime' | null
  >(null)
  const [showRealtimeDialog, setShowRealtimeDialog] = useState(false)

  const handleModeSelect = (mode: 'classic' | 'realtime') => {
    if (mode === 'realtime') {
      setShowRealtimeDialog(true)
    } else {
      setSelectedMode(mode)
    }
  }

  const confirmRealtimeMode = () => {
    setSelectedMode('realtime')
    setShowRealtimeDialog(false)
  }

  if (selectedMode === 'classic') {
    return (
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedMode(null)}
            className="text-xs"
          >
            Switch Mode
          </Button>
        </div>
        <ClientChatWidget clientId={clientId} clientName={clientName} />
      </div>
    )
  }

  if (selectedMode === 'realtime') {
    return (
      <ClientChatRealtime
        clientId={clientId}
        clientName={clientName}
        onClose={() => setSelectedMode(null)}
      />
    )
  }

  return (
    <>
      <Card className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-ink mb-2">
            Choose Your Chat Experience
          </h3>
          <p className="text-sm text-ink-3 ">
            Select how you&apos;d like to interact with{' '}
            {clientName || 'your client'}
            &apos;s AI assistant
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Classic Chat Mode */}
          <Card
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-line-strong "
            onClick={() => handleModeSelect('classic')}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-surface-3 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-ink-2 " />
              </div>

              <div>
                <h4 className="font-semibold text-ink mb-1">Classic Chat</h4>
                <p className="text-xs text-ink-3 mb-2">
                  Text-based conversation with optional voice input
                </p>
              </div>

              <div className="flex flex-wrap gap-1 justify-center">
                <Badge variant="secondary" className="text-xs">
                  Multi-provider
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Markdown
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Sources
                </Badge>
              </div>

              <div className="w-full pt-3 border-t ">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-3 ">Response time</span>
                  <span className="font-medium">2-3 seconds</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-ink-3 ">Cost</span>
                  <span className="font-medium text-forest">Low</span>
                </div>
              </div>

              <Button className="w-full mt-2" variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Classic Chat
              </Button>
            </div>
          </Card>

          {/* Realtime Voice Mode */}
          <Card
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-indigo relative"
            onClick={() => handleModeSelect('realtime')}
          >
            <div className="absolute top-2 right-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="default" className="text-xs  ">
                      <Zap className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Advanced AI with real-time processing</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-12 w-12 rounded-lg bg-surface-3 flex items-center justify-center shadow-lg">
                <Headphones className="h-6 w-6 text-ink-on-dark" />
              </div>

              <div>
                <h4 className="font-semibold text-ink mb-1">Realtime Voice</h4>
                <p className="text-xs text-ink-3 mb-2">
                  Natural speech-to-speech conversation
                </p>
              </div>

              <div className="flex flex-wrap gap-1 justify-center">
                <Badge className="text-xs bg-indigo-bg text-indigo border-indigo ">
                  <Sparkles className="h-3 w-3 mr-1" />
                  GPT-4o
                </Badge>
                <Badge className="text-xs bg-indigo-bg text-indigo border-indigo ">
                  Native Audio
                </Badge>
                <Badge className="text-xs bg-indigo-bg text-indigo border-indigo ">
                  Live RAG
                </Badge>
              </div>

              <div className="w-full pt-3 border-t ">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-3 ">Response time</span>
                  <span className="font-medium text-indigo ">~300ms</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-ink-3 ">Cost</span>
                  <span className="font-medium text-amber-token">
                    $0.06/min
                  </span>
                </div>
              </div>

              <Button className="w-full mt-2  hover:" size="sm">
                <Headphones className="h-4 w-4 mr-2" />
                Start Voice Chat
              </Button>
            </div>
          </Card>
        </div>
      </Card>

      {/* Realtime Mode Confirmation Dialog */}
      <Dialog open={showRealtimeDialog} onOpenChange={setShowRealtimeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-indigo" />
              Enable Realtime Voice Chat
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-indigo-bg border border-indigo rounded-lg p-3">
              <h4 className="font-medium text-sm text-indigo mb-2">
                Premium Features
              </h4>
              <ul className="space-y-1 text-xs text-indigo ">
                <li className="flex items-start gap-2">
                  <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Ultra-low latency (~300ms) responses</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Natural conversation with interruptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Direct audio understanding (no transcription)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Access to full coaching session context</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-token-bg border border-amber-token rounded-lg p-3">
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-amber-token mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-amber-token mb-1">
                    Usage Costs
                  </p>
                  <p className="text-amber-token ">
                    Voice input: $0.06/minute • Voice output: $0.24/minute
                  </p>
                  <p className="text-amber-token mt-1">
                    Typical 5-minute conversation: ~$0.30-$0.50
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-paper border border-line rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-ink-3 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-ink-3 ">
                  <p className="mb-1">
                    Requires microphone access and a stable internet connection.
                  </p>
                  <p>You can switch back to classic chat mode at any time.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRealtimeDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={confirmRealtimeMode} className="flex-1  hover:">
                <Headphones className="h-4 w-4 mr-2" />
                Enable Voice Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
