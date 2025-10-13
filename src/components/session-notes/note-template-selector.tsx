'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SessionNotesService } from '@/services/session-notes-service'
import { NoteTemplate, NoteType } from '@/types/session-note'
import { Loader2 } from 'lucide-react'

interface NoteTemplateSelectorProps {
  noteType: NoteType
  onSelect: (templateContent: string, templateId: string) => void
}

export function NoteTemplateSelector({
  noteType,
  onSelect,
}: NoteTemplateSelectorProps) {
  const [templates, setTemplates] = useState<NoteTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  // Fetch templates for the current note type
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true)
      try {
        const fetchedTemplates = await SessionNotesService.getTemplates(
          noteType,
          true,
        )
        setTemplates(fetchedTemplates)

        // Auto-select default template if exists
        const defaultTemplate = fetchedTemplates.find(t => t.is_default)
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id)
          onSelect(defaultTemplate.template_content, defaultTemplate.id)
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [noteType])

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)

    if (templateId === 'none') {
      onSelect('', '')
      return
    }

    const template = templates.find(t => t.id === templateId)
    if (template) {
      onSelect(template.template_content, template.id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading templates...
      </div>
    )
  }

  if (templates.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="template" className="text-sm font-medium">
        Use Template (Optional)
      </Label>
      <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
        <SelectTrigger id="template">
          <SelectValue placeholder="Select a template..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No template</SelectItem>
          {templates.map(template => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
              {template.is_default && ' (Default)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedTemplateId && selectedTemplateId !== 'none' && (
        <p className="text-xs text-gray-500">
          Template will be applied to the content below
        </p>
      )}
    </div>
  )
}
