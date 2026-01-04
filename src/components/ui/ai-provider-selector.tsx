'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Brain, Sparkles, Zap, Info } from 'lucide-react'

export type AIProvider = 'openai' | 'gemini' | 'claude'

interface AIProviderInfo {
  id: AIProvider
  name: string
  icon: React.ReactNode
  description: string
  models?: string[]
  badge?: string
}

const providers: AIProviderInfo[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: <Brain className="h-4 w-4" />,
    description: 'GPT-4.1 models with strong reasoning',
    models: ['gpt-4.1-mini', 'gpt-4.1'],
    badge: 'Default',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: <Sparkles className="h-4 w-4" />,
    description: "Google's multimodal AI model",
    models: ['gemini-2.0-flash', 'gemini-2.0-pro'],
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: <Zap className="h-4 w-4" />,
    description: "Anthropic's helpful assistant",
    models: ['claude-3-5-haiku', 'claude-sonnet-4-5'],
  },
]

interface AIProviderSelectorProps {
  value: AIProvider
  onChange: (provider: AIProvider) => void
  variant?: 'dropdown' | 'radio'
  className?: string
}

export function AIProviderSelector({
  value,
  onChange,
  variant = 'dropdown',
  className,
}: AIProviderSelectorProps) {
  if (variant === 'dropdown') {
    return (
      <div className={className}>
        <Select value={value} onValueChange={v => onChange(v as AIProvider)}>
          <SelectTrigger className="w-full bg-white border-gray-200">
            <SelectValue>
              {(() => {
                const provider = providers.find(p => p.id === value)
                return provider ? (
                  <div className="flex items-center gap-2">
                    {provider.icon}
                    <span className="text-sm">{provider.name}</span>
                    {provider.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {provider.badge}
                      </Badge>
                    )}
                  </div>
                ) : (
                  'Select AI Model'
                )
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {providers.map(provider => (
              <SelectItem key={provider.id} value={provider.id}>
                <div className="flex items-center gap-2">
                  {provider.icon}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{provider.name}</span>
                      {provider.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {provider.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {provider.description}
                    </p>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // Radio variant
  return (
    <div className={className}>
      <RadioGroup value={value} onValueChange={v => onChange(v as AIProvider)}>
        <div className="space-y-2">
          {providers.map(provider => (
            <div key={provider.id} className="flex items-start space-x-2">
              <RadioGroupItem value={provider.id} id={provider.id} />
              <Label htmlFor={provider.id} className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  {provider.icon}
                  <span className="font-medium">{provider.name}</span>
                  {provider.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {provider.badge}
                    </Badge>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{provider.description}</p>
                        {provider.models && (
                          <p className="text-xs text-gray-400 mt-1">
                            Models: {provider.models.join(', ')}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {provider.description}
                </p>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  )
}
