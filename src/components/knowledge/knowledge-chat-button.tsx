'use client'

import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { knowledgeService } from '@/services/knowledge-service'
import type {
  ChatMessage,
  KnowledgeSource,
  KnowledgeCategory,
} from '@/types/knowledge'
import { CATEGORY_METADATA } from '@/types/knowledge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Send,
  Loader2,
  BookOpen,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  History,
  Trash2,
} from 'lucide-react'
import { ChatMarkdown } from '@/components/ui/chat-markdown'
import { cn } from '@/lib/utils'

interface Message extends ChatMessage {
  sources?: KnowledgeSource[]
  isLoading?: boolean
}

export function KnowledgeChatButton() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<
    KnowledgeCategory[]
  >([])
  const [provider, setProvider] = useState<'openai' | 'gemini' | 'claude'>(
    'openai',
  )
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch chat sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['knowledge-chat-sessions'],
    queryFn: () => knowledgeService.listChatSessions(10),
    enabled: open && showHistory,
  })

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (question: string) => {
      return knowledgeService.sendChatMessage(question, {
        sessionId: sessionId || undefined,
        categories:
          selectedCategories.length > 0 ? selectedCategories : undefined,
        conversationHistory: messages.filter(m => !m.isLoading).slice(-6),
        provider,
      })
    },
    onMutate: question => {
      // Optimistically add user message
      setMessages(prev => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: '', isLoading: true },
      ])
    },
    onSuccess: response => {
      // Update with actual response
      setMessages(prev => {
        const newMessages = prev.filter(m => !m.isLoading)
        return [
          ...newMessages,
          {
            role: 'assistant',
            content: response.answer,
            sources: response.sources,
          },
        ]
      })
      setSessionId(response.session_id)
      queryClient.invalidateQueries({ queryKey: ['knowledge-chat-sessions'] })
    },
    onError: () => {
      // Remove loading message on error
      setMessages(prev => prev.filter(m => !m.isLoading))
    },
  })

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => knowledgeService.deleteChatSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-chat-sessions'] })
    },
  })

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return
    sendMutation.mutate(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleSourceExpanded = (index: number) => {
    setExpandedSources(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const loadSession = async (id: string) => {
    try {
      const session = await knowledgeService.getChatSession(id)
      setSessionId(session.id)
      setMessages(
        session.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          sources: m.sources,
        })),
      )
      setShowHistory(false)
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setSessionId(null)
    setExpandedSources(new Set())
    setShowHistory(false)
  }

  const sessions = sessionsData?.sessions ?? []

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <SheetTitle>Knowledge Assistant</SheetTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={startNewChat}>
                New Chat
              </Button>
            </div>
          </div>
          <SheetDescription className="text-xs">
            Ask questions about coaching resources and best practices
          </SheetDescription>
        </SheetHeader>

        {showHistory ? (
          // Session History View
          <ScrollArea className="flex-1 p-4">
            <h3 className="font-medium text-sm text-gray-500 mb-3">
              Recent Conversations
            </h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No previous conversations
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                    onClick={() => loadSession(session.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {session.title || 'Untitled conversation'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.message_count} messages •{' '}
                        {session.last_message_at
                          ? new Date(
                              session.last_message_at,
                            ).toLocaleDateString()
                          : 'No messages'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation()
                        deleteSessionMutation.mutate(session.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        ) : (
          // Chat View
          <>
            {/* Category Filter */}
            <div className="px-4 py-2 border-b flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Filter:</span>
              {Object.entries(CATEGORY_METADATA).map(([key, meta]) => (
                <Badge
                  key={key}
                  variant={
                    selectedCategories.includes(key as KnowledgeCategory)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    setSelectedCategories(prev =>
                      prev.includes(key as KnowledgeCategory)
                        ? prev.filter(c => c !== key)
                        : [...prev, key as KnowledgeCategory],
                    )
                  }}
                >
                  {meta.name}
                </Badge>
              ))}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1" ref={scrollRef}>
              <div className="p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">
                      Ask about coaching
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Get answers from your knowledge base
                    </p>
                    <div className="space-y-2 text-sm">
                      {[
                        'What coaching techniques work best for goal setting?',
                        'How should I handle difficult client conversations?',
                        'What are effective frameworks for coaching sessions?',
                      ].map((suggestion, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="w-full text-left justify-start h-auto py-2"
                          onClick={() => {
                            setInput(suggestion)
                          }}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex',
                        message.role === 'user'
                          ? 'justify-end'
                          : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-lg px-4 py-2',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100',
                        )}
                      >
                        {message.isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        ) : message.role === 'assistant' ? (
                          <ChatMarkdown content={message.content} />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <button
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                              onClick={() => toggleSourceExpanded(index)}
                            >
                              <FileText className="h-3 w-3" />
                              {message.sources.length} source
                              {message.sources.length !== 1 ? 's' : ''}
                              {expandedSources.has(index) ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                            {expandedSources.has(index) && (
                              <div className="mt-2 space-y-2">
                                {message.sources.map((source, si) => (
                                  <div
                                    key={si}
                                    className="p-2 bg-white rounded border text-xs"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium truncate">
                                        {source.document_title}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {Math.round(
                                          source.relevance_score * 100,
                                        )}
                                        %
                                      </Badge>
                                    </div>
                                    <p className="text-gray-600 line-clamp-2">
                                      {source.excerpt}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Select
                  value={provider}
                  onValueChange={v => setProvider(v as typeof provider)}
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  disabled={sendMutation.isPending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMutation.isPending}
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
