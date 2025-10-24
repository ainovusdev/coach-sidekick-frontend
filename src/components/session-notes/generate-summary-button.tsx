'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { SessionNotesService } from '@/services/session-notes-service'
import { SummaryStyle } from '@/types/session-note'
import { Sparkles, Loader2, Copy, Check } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface GenerateSummaryButtonProps {
  sessionId: string
  onSummaryGenerated?: (summary: string) => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function GenerateSummaryButton({
  sessionId,
  onSummaryGenerated,
  variant = 'outline',
  size = 'sm',
}: GenerateSummaryButtonProps) {
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [summaryStyle, setSummaryStyle] =
    useState<SummaryStyle>('comprehensive')
  const [includeQuotes, setIncludeQuotes] = useState(true)
  const [generatedSummary, setGeneratedSummary] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await SessionNotesService.generateSummary(sessionId, {
        summary_style: summaryStyle,
        include_quotes: includeQuotes,
      })

      setGeneratedSummary(result.summary)

      if (onSummaryGenerated) {
        onSummaryGenerated(result.summary)
      }

      toast({
        title: 'Summary Generated',
        description: 'AI has generated a summary from your session transcript',
      })
    } catch (error) {
      console.error('Failed to generate summary:', error)
      toast({
        title: 'Generation Failed',
        description:
          error instanceof Error ? error.message : 'Failed to generate summary',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedSummary)
      setCopied(true)
      toast({
        title: 'Copied',
        description: 'Summary copied to clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy summary to clipboard',
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    setOpen(false)
    setGeneratedSummary('')
    setCopied(false)
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        size={size}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Generate Summary
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              AI-Generated Summary
            </DialogTitle>
            <DialogDescription>
              Generate an AI-powered summary from the session transcript. You
              can customize the style and content below.
            </DialogDescription>
          </DialogHeader>

          {!generatedSummary ? (
            <div className="space-y-4 py-4">
              {/* Summary Style */}
              <div className="space-y-2">
                <Label htmlFor="summary-style">Summary Style</Label>
                <Select
                  value={summaryStyle}
                  onValueChange={value =>
                    setSummaryStyle(value as SummaryStyle)
                  }
                  disabled={generating}
                >
                  <SelectTrigger id="summary-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">
                      Brief - Short and concise
                    </SelectItem>
                    <SelectItem value="comprehensive">
                      Comprehensive - Detailed overview
                    </SelectItem>
                    <SelectItem value="bullet_points">
                      Bullet Points - Key highlights
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Include Quotes */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-quotes"
                  checked={includeQuotes}
                  onCheckedChange={checked =>
                    setIncludeQuotes(checked as boolean)
                  }
                  disabled={generating}
                />
                <Label
                  htmlFor="include-quotes"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include direct quotes from the transcript
                </Label>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={generating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Summary
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Generated Summary Display */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                    {generatedSummary}
                  </pre>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button onClick={handleClose}>Done</Button>
              </DialogFooter>

              <p className="text-xs text-gray-500 text-center">
                You can copy this summary and paste it into a new note
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
