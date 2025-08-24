'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Database,
  BookOpen,
  AlertCircle,
  Loader2,
  MessageSquare,
  ChevronDown
} from 'lucide-react'
import { chatService, type ChatMessage, type ChatStats } from '@/services/chat-service'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import '@/styles/markdown.css'

interface ClientChatProps {
  clientId: string
  clientName?: string
}

export function ClientChat({ clientId, clientName }: ClientChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [showSources, setShowSources] = useState<{ [key: number]: boolean }>({})
  const [expandedSources, setExpandedSources] = useState<{ [key: string]: boolean }>({})
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchStats()
  }, [clientId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const data = await chatService.getClientKnowledgeStats(clientId)
      setStats(data)
      setSuggestedQuestions(data.suggested_questions || [])
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await chatService.askQuestion(
        clientId,
        userMessage.content,
        messages
      )

      const assistantMessage: ChatMessage & { sources?: any[], confidence?: string } = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update suggested questions if provided
      if (response.suggested_questions && response.suggested_questions.length > 0) {
        setSuggestedQuestions(response.suggested_questions)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I encountered an error processing your question. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  const toggleSources = (index: number) => {
    setShowSources(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loadingStats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (!stats || stats.total_chunks === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Knowledge Base Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              The knowledge base will be built when you analyze coaching sessions. 
              Trigger an analysis from the sessions page to start building the searchable knowledge base.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Indexed Sessions</p>
              <p className="text-lg font-semibold text-gray-900">{stats.unique_sessions}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Knowledge Chunks</p>
              <p className="text-lg font-semibold text-gray-900">{stats.total_chunks}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Top Topics</p>
              <div className="flex gap-1 mt-1">
                {stats.top_topics.slice(0, 3).map((topic, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                    {topic.topic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <Card className="border-gray-200 h-[600px] flex flex-col">
        <CardHeader className="bg-gray-50 border-b border-gray-100 py-4">
          <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            Ask About {clientName || 'Client'}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">
                  Ask me anything about {clientName || 'this client'} based on your coaching sessions
                </p>
                
                {/* Suggested Questions */}
                {suggestedQuestions.length > 0 && (
                  <div className="space-y-2 max-w-lg mx-auto">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      Suggested Questions
                    </p>
                    {suggestedQuestions.slice(0, 4).map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{question}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, idx) => {
                  const isAssistant = message.role === 'assistant'
                  const messageData = message as any
                  
                  return (
                    <div key={idx} className={cn(
                      "flex gap-3",
                      isAssistant ? "justify-start" : "justify-end"
                    )}>
                      {isAssistant && (
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                      )}
                      
                      <div className={cn(
                        "max-w-[80%] space-y-2",
                        !isAssistant && "text-right"
                      )}>
                        <div className={cn(
                          "rounded-lg px-4 py-3",
                          isAssistant 
                            ? "bg-gray-50 text-gray-900 border border-gray-200" 
                            : "bg-gray-900 text-white"
                        )}>
                          {isAssistant ? (
                            <div className="markdown-content text-sm">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  // Typography
                                  p: ({children}) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                                  
                                  // Headings
                                  h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 mb-3 mt-4 first:mt-0">{children}</h1>,
                                  h2: ({children}) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-3 first:mt-0">{children}</h2>,
                                  h3: ({children}) => <h3 className="text-sm font-semibold text-gray-800 mb-2 mt-2 first:mt-0">{children}</h3>,
                                  h4: ({children}) => <h4 className="text-sm font-medium text-gray-800 mb-1 mt-2 first:mt-0">{children}</h4>,
                                  
                                  // Lists
                                  ul: ({children}) => <ul className="list-disc list-inside pl-2 mb-3 space-y-1 text-gray-700">{children}</ul>,
                                  ol: ({children}) => <ol className="list-decimal list-inside pl-2 mb-3 space-y-1 text-gray-700">{children}</ol>,
                                  li: ({children}) => <li className="text-sm leading-relaxed">{children}</li>,
                                  
                                  // Code
                                  code: ({inline, className, children}) => {
                                    const match = /language-(\w+)/.exec(className || '')
                                    const lang = match ? match[1] : ''
                                    return inline ? (
                                      <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
                                        {children}
                                      </code>
                                    ) : (
                                      <div className="relative mb-3">
                                        {lang && (
                                          <div className="absolute top-0 right-0 px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-tl rounded-br font-mono">
                                            {lang}
                                          </div>
                                        )}
                                        <code className="block bg-gray-100 text-gray-800 p-3 rounded text-xs font-mono overflow-x-auto">
                                          {children}
                                        </code>
                                      </div>
                                    )
                                  },
                                  pre: ({children}) => <>{children}</>,
                                  
                                  // Blockquote
                                  blockquote: ({children}) => (
                                    <blockquote className="border-l-4 border-gray-400 pl-4 my-3 text-gray-700 italic">
                                      {children}
                                    </blockquote>
                                  ),
                                  
                                  // Emphasis
                                  strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                  em: ({children}) => <em className="italic">{children}</em>,
                                  
                                  // Links
                                  a: ({href, children}) => (
                                    <a 
                                      href={href} 
                                      className="text-gray-700 underline decoration-gray-400 hover:text-gray-900 hover:decoration-gray-600 transition-colors" 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      {children}
                                    </a>
                                  ),
                                  
                                  // Horizontal rule
                                  hr: () => <hr className="my-4 border-gray-300" />,
                                  
                                  // Tables
                                  table: ({children}) => (
                                    <div className="overflow-x-auto mb-3">
                                      <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded">
                                        {children}
                                      </table>
                                    </div>
                                  ),
                                  thead: ({children}) => <thead className="bg-gray-50">{children}</thead>,
                                  tbody: ({children}) => <tbody className="divide-y divide-gray-200">{children}</tbody>,
                                  tr: ({children}) => <tr>{children}</tr>,
                                  th: ({children}) => (
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                      {children}
                                    </th>
                                  ),
                                  td: ({children}) => (
                                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                                      {children}
                                    </td>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                        </div>
                        
                        {/* Sources and Confidence for assistant messages */}
                        {isAssistant && messageData.sources && messageData.sources.length > 0 && (
                          <div className="space-y-2">
                            <button
                              onClick={() => toggleSources(idx)}
                              className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                            >
                              <BookOpen className="h-3 w-3" />
                              <span>{showSources[idx] ? 'Hide' : 'Show'} {messageData.sources.length} source{messageData.sources.length > 1 ? 's' : ''}</span>
                              <ChevronDown className={cn(
                                "h-3 w-3 transition-transform",
                                showSources[idx] && "rotate-180"
                              )} />
                            </button>
                            
                            {showSources[idx] && (
                              <div className="space-y-2 mt-2">
                                <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                  <BookOpen className="h-3.5 w-3.5" />
                                  <span>Sources from coaching sessions</span>
                                </div>
                                {messageData.sources.map((source: any, sourceIdx: number) => (
                                  <div key={sourceIdx} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                                    {/* Source Header */}
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-gray-700">
                                            Session: {new Date(source.date).toLocaleDateString()}
                                          </span>
                                          <Badge variant="outline" className="text-xs bg-gray-50">
                                            {source.chunk_type || 'dialogue'}
                                          </Badge>
                                        </div>
                                        {source.timestamp && (
                                          <span className="text-xs text-gray-500">
                                            {new Date(source.timestamp).toLocaleTimeString()}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                        {(source.relevance_score * 100).toFixed(0)}% match
                                      </span>
                                    </div>
                                    
                                    {/* Source Content */}
                                    {source.content ? (
                                      <div className="space-y-1">
                                        <div className="bg-gray-50 rounded p-2">
                                          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {expandedSources[`${idx}-${sourceIdx}`] || source.content.length <= 500
                                              ? source.content
                                              : `${source.content.substring(0, 500)}...`}
                                          </p>
                                        </div>
                                        {source.content.length > 500 && (
                                          <button
                                            onClick={() => setExpandedSources(prev => ({
                                              ...prev,
                                              [`${idx}-${sourceIdx}`]: !prev[`${idx}-${sourceIdx}`]
                                            }))}
                                            className="text-xs text-gray-600 hover:text-gray-800 underline"
                                          >
                                            {expandedSources[`${idx}-${sourceIdx}`] ? 'Show less' : 'Show more'}
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="bg-gray-50 rounded p-2">
                                        <p className="text-xs text-gray-500 italic">
                                          No content preview available
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Topics and Speaker Ratio */}
                                    <div className="flex items-center justify-between">
                                      {source.topics && source.topics.length > 0 && (
                                        <div className="flex gap-1 flex-wrap">
                                          {source.topics.map((topic: string, topicIdx: number) => (
                                            <Badge key={topicIdx} variant="outline" className="text-xs py-0 bg-white">
                                              {topic}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {source.speaker_ratio && Object.keys(source.speaker_ratio).length > 0 && (
                                        <div className="flex gap-2 text-xs text-gray-500">
                                          {Object.entries(source.speaker_ratio).map(([speaker, ratio]: [string, any]) => (
                                            <span key={speaker}>
                                              {speaker}: {(ratio * 100).toFixed(0)}%
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {messageData.confidence && (
                              <div className="mt-2">
                                <div className={cn(
                                  "inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border",
                                  getConfidenceColor(messageData.confidence)
                                )}>
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  <span className="font-medium capitalize">{messageData.confidence} confidence</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {!isAssistant && (
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={`Ask about ${clientName || 'this client'}...`}
                className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}