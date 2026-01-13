'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { CSVImportRow } from '@/types/admin-client'
import { useAdminUsers } from '@/hooks/queries/use-admin-users'
import { useImportClients } from '@/hooks/mutations/use-admin-client-mutations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'

type ImportStep = 'upload' | 'mapping' | 'preview' | 'result'

interface CSVColumn {
  header: string
  sampleValues: string[]
}

interface ColumnMapping {
  [csvColumn: string]: string
}

const CLIENT_FIELDS = [
  { value: 'name', label: 'Name', required: true },
  { value: 'email', label: 'Email', required: false },
  { value: 'phone', label: 'Phone', required: false },
  { value: 'notes', label: 'Notes', required: false },
  { value: 'tags', label: 'Tags (comma-separated)', required: false },
  { value: 'coach_email', label: 'Coach Email', required: false },
  { value: 'skip', label: '-- Skip this column --', required: false },
]

export default function ImportClientsPage() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [csvData, setCsvData] = useState<string[][]>([])
  const [csvColumns, setCsvColumns] = useState<CSVColumn[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [defaultCoachId, setDefaultCoachId] = useState<string>('')
  const [importResult, setImportResult] = useState<{
    success_count: number
    failed_count: number
    errors: { row: number; error: string }[]
  } | null>(null)

  const { data: users = [] } = useAdminUsers({ limit: 100 })
  const coaches = users.filter(
    u =>
      u.roles.includes('coach') ||
      u.roles.includes('admin') ||
      u.roles.includes('super_admin'),
  )

  const { mutate: importClients, isPending: isImporting } = useImportClients()

  // Parse CSV file
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = e => {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        const rows = lines.map(line => {
          // Handle CSV with quoted values
          const result: string[] = []
          let current = ''
          let inQuotes = false

          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          result.push(current.trim())
          return result
        })

        if (rows.length < 2) {
          alert('CSV must have at least a header row and one data row')
          return
        }

        const headers = rows[0]
        const dataRows = rows.slice(1)

        // Build column info
        const columns: CSVColumn[] = headers.map((header, index) => ({
          header,
          sampleValues: dataRows.slice(0, 3).map(row => row[index] || ''),
        }))

        setCsvColumns(columns)
        setCsvData(rows)

        // Auto-map columns by name matching
        const autoMapping: ColumnMapping = {}
        columns.forEach(col => {
          const headerLower = col.header.toLowerCase().trim()
          if (headerLower.includes('name') && !headerLower.includes('coach')) {
            autoMapping[col.header] = 'name'
          } else if (
            headerLower.includes('email') &&
            !headerLower.includes('coach')
          ) {
            autoMapping[col.header] = 'email'
          } else if (
            headerLower.includes('phone') ||
            headerLower.includes('tel')
          ) {
            autoMapping[col.header] = 'phone'
          } else if (headerLower.includes('note')) {
            autoMapping[col.header] = 'notes'
          } else if (headerLower.includes('tag')) {
            autoMapping[col.header] = 'tags'
          } else if (headerLower.includes('coach')) {
            autoMapping[col.header] = 'coach_email'
          }
        })
        setColumnMapping(autoMapping)

        setStep('mapping')
      }
      reader.readAsText(file)
    },
    [],
  )

  // Handle column mapping change
  const handleMappingChange = (csvColumn: string, targetField: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvColumn]: targetField,
    }))
  }

  // Build preview rows
  const previewRows = useMemo(() => {
    if (csvData.length < 2) return []

    const headers = csvData[0]
    const dataRows = csvData.slice(1, 11) // First 10 data rows

    return dataRows.map(row => {
      const mapped: CSVImportRow = { name: '' }

      headers.forEach((header, index) => {
        const targetField = columnMapping[header]
        if (targetField && targetField !== 'skip') {
          const value = row[index] || ''
          if (targetField === 'name') mapped.name = value
          else if (targetField === 'email') mapped.email = value || undefined
          else if (targetField === 'phone') mapped.phone = value || undefined
          else if (targetField === 'notes') mapped.notes = value || undefined
          else if (targetField === 'tags') mapped.tags = value || undefined
          else if (targetField === 'coach_email')
            mapped.coach_email = value || undefined
        }
      })

      return mapped
    })
  }, [csvData, columnMapping])

  // Check if mapping is valid
  const isMappingValid = useMemo(() => {
    return Object.values(columnMapping).includes('name')
  }, [columnMapping])

  // Build all rows for import
  const buildImportRows = (): CSVImportRow[] => {
    if (csvData.length < 2) return []

    const headers = csvData[0]
    const dataRows = csvData.slice(1)

    return dataRows
      .map(row => {
        const mapped: CSVImportRow = { name: '' }

        headers.forEach((header, index) => {
          const targetField = columnMapping[header]
          if (targetField && targetField !== 'skip') {
            const value = row[index] || ''
            if (targetField === 'name') mapped.name = value
            else if (targetField === 'email') mapped.email = value || undefined
            else if (targetField === 'phone') mapped.phone = value || undefined
            else if (targetField === 'notes') mapped.notes = value || undefined
            else if (targetField === 'tags') mapped.tags = value || undefined
            else if (targetField === 'coach_email')
              mapped.coach_email = value || undefined
          }
        })

        return mapped
      })
      .filter(row => row.name.trim() !== '') // Filter out empty rows
  }

  // Handle import
  const handleImport = () => {
    const rows = buildImportRows()

    importClients(
      {
        rows,
        default_coach_id: defaultCoachId || undefined,
      },
      {
        onSuccess: result => {
          setImportResult(result)
          setStep('result')
        },
      },
    )
  }

  // Reset and start over
  const handleReset = () => {
    setCsvData([])
    setCsvColumns([])
    setColumnMapping({})
    setDefaultCoachId('')
    setImportResult(null)
    setStep('upload')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Import Clients
        </h1>
        <p className="text-gray-500 mt-2">
          Upload a CSV file to bulk import clients
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {['upload', 'mapping', 'preview', 'result'].map((s, index) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : ['upload', 'mapping', 'preview', 'result'].indexOf(step) >
                      index
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {['upload', 'mapping', 'preview', 'result'].indexOf(step) >
              index ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className="ml-2 text-sm font-medium capitalize hidden sm:inline">
              {s}
            </span>
            {index < 3 && (
              <div className="w-12 h-0.5 bg-gray-200 mx-4 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Drag and drop a CSV file here, or click to browse
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <Button asChild>
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </label>
              </Button>
              <p className="text-sm text-gray-400 mt-4">
                CSV should have headers in the first row. Supported columns:
                Name (required), Email, Phone, Notes, Tags, Coach Email
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-600">
              Map each CSV column to a client field. At minimum, you must map
              the Name field.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CSV Column</TableHead>
                  <TableHead>Sample Values</TableHead>
                  <TableHead>Map To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvColumns.map(col => (
                  <TableRow key={col.header}>
                    <TableCell className="font-medium">{col.header}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {col.sampleValues.slice(0, 2).join(', ')}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={columnMapping[col.header] || ''}
                        onValueChange={value =>
                          handleMappingChange(col.header, value)
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CLIENT_FIELDS.map(field => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                              {field.required && ' *'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">
                Default Coach (if not specified per row):
              </label>
              <Select value={defaultCoachId} onValueChange={setDefaultCoachId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select a default coach" />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map(coach => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.full_name || coach.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Start Over
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={!isMappingValid}
              >
                Continue to Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-600">
              Review the first 10 rows before importing. Total rows to import:{' '}
              <strong>{csvData.length - 1}</strong>
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Coach Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {row.name || (
                        <span className="text-red-500">Missing</span>
                      )}
                    </TableCell>
                    <TableCell>{row.email || '-'}</TableCell>
                    <TableCell>{row.phone || '-'}</TableCell>
                    <TableCell>{row.tags || '-'}</TableCell>
                    <TableCell>{row.coach_email || '(default)'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back to Mapping
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {csvData.length - 1} Clients
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === 'result' && importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import Complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {importResult.success_count}
                </div>
                <div className="text-sm text-green-700">
                  Imported Successfully
                </div>
              </div>
              <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600">
                  {importResult.failed_count}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Errors:</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {importResult.errors.map((err, index) => (
                    <div key={index} className="flex items-start gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span className="text-sm text-red-700">
                        Row {err.row}: {err.error}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Import More
              </Button>
              <Button asChild>
                <Link href="/admin/clients">View All Clients</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
