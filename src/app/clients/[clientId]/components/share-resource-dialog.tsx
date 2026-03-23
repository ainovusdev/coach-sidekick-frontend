'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useResources } from '@/hooks/queries/use-resources'
import { useClientsSimple } from '@/hooks/queries/use-clients'
import { useShareResource } from '@/hooks/mutations/use-resource-mutations'
import {
  BookOpen,
  FileText,
  Video,
  Link2,
  Plus,
  Check,
  Library,
  ClipboardList,
  Dumbbell,
  FileEdit,
  Newspaper,
  Users,
  Search,
  X,
} from 'lucide-react'
import type { SharedResource } from '@/types/resource'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/resource'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  general: FileText,
  document: FileText,
  worksheet: ClipboardList,
  exercise: Dumbbell,
  article: Newspaper,
  template: FileEdit,
  video: Video,
  link: Link2,
}

interface ShareResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName?: string
  onCreateNew: () => void
}

export function ShareResourceDialog({
  open,
  onOpenChange,
  clientId,
  clientName: _clientName,
  onCreateNew,
}: ShareResourceDialogProps) {
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<string>>(
    new Set(),
  )
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(
    new Set(),
  )
  const [clientSearch, setClientSearch] = useState('')

  // Fetch personal resources that could be shared
  const { data, isLoading } = useResources({ scope: 'personal' })
  const { data: clientsData } = useClientsSimple()
  const shareResource = useShareResource()

  const personalResources = data?.resources || []
  const allClients = clientsData?.clients || []

  // Pre-select the current client when dialog opens
  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (isOpen) {
      setSelectedClientIds(new Set([clientId]))
      setSelectedResourceIds(new Set())
      setClientSearch('')
    }
  }

  // Filter clients by search
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return allClients
    const q = clientSearch.toLowerCase()
    return allClients.filter(
      (c: any) =>
        c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q),
    )
  }, [allClients, clientSearch])

  // Get selected client objects for display
  const selectedClients = useMemo(
    () => allClients.filter((c: any) => selectedClientIds.has(c.id)),
    [allClients, selectedClientIds],
  )

  const toggleResource = (id: string) => {
    setSelectedResourceIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleClient = (id: string) => {
    setSelectedClientIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleShare = async () => {
    // For each resource × each client, fire a share call
    const promises: Promise<any>[] = []
    for (const resourceId of selectedResourceIds) {
      for (const cId of selectedClientIds) {
        promises.push(
          shareResource
            .mutateAsync({
              id: resourceId,
              data: { shared_with_client_id: cId },
            })
            .catch(() => {
              // Swallow individual errors (e.g. already shared) — toast is shown by hook
            }),
        )
      }
    }
    await Promise.all(promises)
    setSelectedResourceIds(new Set())
    setSelectedClientIds(new Set())
    onOpenChange(false)
  }

  const _totalShareActions = selectedResourceIds.size * selectedClientIds.size

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Share Resources</DialogTitle>
          <DialogDescription>
            Select resources and clients to share with
          </DialogDescription>
        </DialogHeader>

        {/* Client Selector */}
        <div className="space-y-2 pb-3 border-b border-gray-100 dark:border-gray-800">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-500" />
            Share with
          </label>

          {/* Selected client tags */}
          {selectedClients.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedClients.map((client: any) => (
                <span
                  key={client.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                >
                  {client.name}
                  <button
                    type="button"
                    onClick={() => toggleClient(client.id)}
                    className="hover:bg-white/20 dark:hover:bg-black/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Client search + dropdown */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              placeholder="Search clients to add..."
              className="h-8 text-sm pl-8"
            />
          </div>

          {/* Client list (show when searching or when few clients selected) */}
          {(clientSearch.trim() || selectedClientIds.size === 0) && (
            <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
              {filteredClients
                .filter((c: any) => !selectedClientIds.has(c.id))
                .map((client: any) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      toggleClient(client.id)
                      setClientSearch('')
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                      'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white',
                    )}
                  >
                    <Plus className="h-3 w-3" />
                    {client.name}
                  </button>
                ))}
              {filteredClients.filter((c: any) => !selectedClientIds.has(c.id))
                .length === 0 &&
                clientSearch.trim() && (
                  <p className="text-xs text-gray-400 py-1">No clients found</p>
                )}
            </div>
          )}
        </div>

        <Tabs
          defaultValue="library"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="library" className="gap-1.5">
              <Library className="h-4 w-4" />
              From Library
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create New
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="library"
            className="flex-1 overflow-y-auto mt-4 space-y-2"
          >
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : personalResources.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No personal resources to share. Create one first.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Select resources to share
                </p>
                {personalResources.map(resource => (
                  <ShareableResourceItem
                    key={resource.id}
                    resource={resource}
                    selected={selectedResourceIds.has(resource.id)}
                    onToggle={() => toggleResource(resource.id)}
                  />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="new" className="mt-4">
            <div className="flex flex-col items-center justify-center py-8">
              <Plus className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                Create a new resource to share
              </p>
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Resource
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {selectedResourceIds.size > 0 && selectedClientIds.size > 0 && (
          <DialogFooter className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              onClick={() => setSelectedResourceIds(new Set())}
            >
              Clear ({selectedResourceIds.size})
            </Button>
            <Button
              onClick={handleShare}
              disabled={shareResource.isPending}
              className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 dark:text-gray-900"
            >
              {shareResource.isPending
                ? 'Sharing...'
                : `Share ${selectedResourceIds.size} resource${selectedResourceIds.size > 1 ? 's' : ''} with ${selectedClientIds.size} client${selectedClientIds.size > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ShareableResourceItem({
  resource,
  selected,
  onToggle,
}: {
  resource: SharedResource
  selected: boolean
  onToggle: () => void
}) {
  const Icon = CATEGORY_ICONS[resource.category] || FileText
  const colors = CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.general

  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        selected
          ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
      }`}
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
          selected
            ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
            : 'border-gray-300 dark:border-gray-500'
        }`}
      >
        {selected && (
          <Check className="h-3 w-3 text-white dark:text-gray-900" />
        )}
      </div>
      <div className={`p-1.5 rounded ${colors.bg} shrink-0`}>
        <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {resource.title}
        </p>
        {resource.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {resource.description}
          </p>
        )}
      </div>
      <Badge
        variant="secondary"
        className={`text-[10px] shrink-0 ${colors.bg} ${colors.text} border-0`}
      >
        {CATEGORY_LABELS[resource.category]}
      </Badge>
    </div>
  )
}
