'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import {
  SessionService,
  ProcessStaleSessionsResponse,
  StaleSessionDetail,
} from '@/services/session-service'
import { toast } from 'sonner'

export function StaleSessionProcessor() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [ageHours, setAgeHours] = useState(4)
  const [dryRun, setDryRun] = useState(true)
  const [results, setResults] = useState<ProcessStaleSessionsResponse | null>(
    null,
  )

  const handleProcess = async () => {
    setIsProcessing(true)
    setResults(null)

    try {
      const response = await SessionService.processStaleSessions({
        age_hours: ageHours,
        dry_run: dryRun,
      })

      setResults(response)

      if (dryRun) {
        toast.info('Dry Run Complete', {
          description: `Found ${response.total_stale_found} stale sessions. ${response.processed} would be processed.`,
        })
      } else {
        toast.success('Processing Complete', {
          description: `Processed ${response.processed} sessions. ${response.skipped} skipped, ${response.errors} errors.`,
        })
      }
    } catch (error) {
      console.error('Failed to process stale sessions:', error)
      toast.error('Processing Failed', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'processed':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Processed
          </Badge>
        )
      case 'would_process':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Clock className="h-3 w-3 mr-1" />
            Would Process
          </Badge>
        )
      case 'skipped':
        return (
          <Badge className="bg-gray-100 text-gray-700">
            <XCircle className="h-3 w-3 mr-1" />
            Skipped
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-orange-600" />
          Stale Session Processor
        </CardTitle>
        <CardDescription>
          Find and process sessions that are stuck in &quot;active&quot; status
          but should be completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age-hours">Age Threshold (hours)</Label>
            <Input
              id="age-hours"
              type="number"
              min={1}
              max={168}
              value={ageHours}
              onChange={e => setAgeHours(Number(e.target.value))}
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500">
              Sessions older than this will be checked
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dry-run">Dry Run Mode</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="dry-run"
                checked={dryRun}
                onCheckedChange={setDryRun}
                disabled={isProcessing}
              />
              <span className="text-sm text-gray-600">
                {dryRun ? 'Preview only' : 'Actually process'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {dryRun
                ? 'See what would be processed without making changes'
                : 'Will actually process and complete sessions'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleProcess}
          disabled={isProcessing}
          className="w-full"
          variant={dryRun ? 'outline' : 'default'}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : dryRun ? (
            <>
              <Clock className="h-4 w-4 mr-2" />
              Preview Stale Sessions
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Process Stale Sessions
            </>
          )}
        </Button>

        {/* Results */}
        {results && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {results.total_stale_found}
                </div>
                <div className="text-xs text-gray-500">Found</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {results.processed}
                </div>
                <div className="text-xs text-gray-500">
                  {dryRun ? 'Would Process' : 'Processed'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {results.skipped}
                </div>
                <div className="text-xs text-gray-500">Skipped</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {results.errors}
                </div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>

            {/* Details List */}
            {results.details.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Details</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {results.details.map((detail: StaleSessionDetail, index) => (
                    <div
                      key={detail.session_id || index}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg text-sm"
                    >
                      <div className="space-y-1">
                        <div className="font-mono text-xs text-gray-600">
                          {detail.session_id.slice(0, 8)}...
                        </div>
                        <div className="text-gray-500">{detail.reason}</div>
                        {detail.recall_status && (
                          <div className="text-xs text-gray-400">
                            Recall Status: {detail.recall_status}
                          </div>
                        )}
                      </div>
                      {getActionBadge(detail.action)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
