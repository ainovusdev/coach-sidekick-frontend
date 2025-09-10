'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  Save,
  RefreshCw,
  Shield,
  Mail,
  Globe,
  Sliders,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    appName: 'Coach Sidekick',
    appUrl: '',
    maintenanceMode: false,
    debugMode: false,
    maxSessionDuration: 120,
    dataRetentionDays: 90,
  })

  // Integration settings
  const [integrationSettings, setIntegrationSettings] = useState({
    openaiApiKey: '',
    recallApiKey: '',
    webhookUrl: '',
    webhookSecret: '',
    personalAiApiKey: '',
    weaviateUrl: '',
  })

  // Feature flags
  const [features, setFeatures] = useState({
    transcriptionEnabled: true,
    aiAnalysisEnabled: true,
    personalAiIntegration: true,
    realtimeTranscripts: true,
    clientPortal: false,
    advancedAnalytics: false,
    exportReports: true,
    bulkOperations: true,
  })

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'Coach Sidekick',
    enableEmailNotifications: true,
  })

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    ipWhitelist: '',
  })

  useEffect(() => {
    fetchSettings()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = async () => {
    setLoading(true)
    try {
      // In a real implementation, fetch settings from API
      // const response = await fetch('/api/v1/admin/settings')
      // const data = await response.json()
      // setSystemSettings(data.system)
      // setIntegrationSettings(data.integrations)
      // etc...

      toast({
        title: 'Settings loaded',
        description: 'System settings have been loaded successfully.',
      })
    } catch (error: any) {
      console.log(error)

      toast({
        title: 'Error',
        description: 'Failed to load settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (section: string) => {
    setSaving(true)
    try {
      // In a real implementation, save settings to API
      // await fetch('/api/v1/admin/settings', {
      //   method: 'PUT',
      //   body: JSON.stringify({ section, data: ... })
      // })

      toast({
        title: 'Settings saved',
        description: `${section} settings have been saved successfully.`,
      })
    } catch (error: any) {
      console.log(error)

      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure system settings, integrations, and features
        </p>
      </div>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                General application settings and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    value={systemSettings.appName}
                    onChange={e =>
                      setSystemSettings({
                        ...systemSettings,
                        appName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appUrl">Application URL</Label>
                  <Input
                    id="appUrl"
                    value={systemSettings.appUrl}
                    onChange={e =>
                      setSystemSettings({
                        ...systemSettings,
                        appUrl: e.target.value,
                      })
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxSession">
                    Max Session Duration (minutes)
                  </Label>
                  <Input
                    id="maxSession"
                    type="number"
                    value={systemSettings.maxSessionDuration}
                    onChange={e =>
                      setSystemSettings({
                        ...systemSettings,
                        maxSessionDuration: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Data Retention (days)</Label>
                  <Input
                    id="retention"
                    type="number"
                    value={systemSettings.dataRetentionDays}
                    onChange={e =>
                      setSystemSettings({
                        ...systemSettings,
                        dataRetentionDays: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable maintenance mode to prevent user access
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={checked =>
                      setSystemSettings({
                        ...systemSettings,
                        maintenanceMode: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable debug logging and error details
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.debugMode}
                    onCheckedChange={checked =>
                      setSystemSettings({
                        ...systemSettings,
                        debugMode: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveSettings('System')}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Configure external service integrations and API keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai">OpenAI API Key</Label>
                  <Input
                    id="openai"
                    type="password"
                    value={integrationSettings.openaiApiKey}
                    onChange={e =>
                      setIntegrationSettings({
                        ...integrationSettings,
                        openaiApiKey: e.target.value,
                      })
                    }
                    placeholder="sk-..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recall">Recall.ai API Key</Label>
                  <Input
                    id="recall"
                    type="password"
                    value={integrationSettings.recallApiKey}
                    onChange={e =>
                      setIntegrationSettings({
                        ...integrationSettings,
                        recallApiKey: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personalai">Personal AI API Key</Label>
                  <Input
                    id="personalai"
                    type="password"
                    value={integrationSettings.personalAiApiKey}
                    onChange={e =>
                      setIntegrationSettings({
                        ...integrationSettings,
                        personalAiApiKey: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook">Webhook URL</Label>
                  <Input
                    id="webhook"
                    value={integrationSettings.webhookUrl}
                    onChange={e =>
                      setIntegrationSettings({
                        ...integrationSettings,
                        webhookUrl: e.target.value,
                      })
                    }
                    placeholder="https://api.example.com/webhook"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook Secret</Label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    value={integrationSettings.webhookSecret}
                    onChange={e =>
                      setIntegrationSettings({
                        ...integrationSettings,
                        webhookSecret: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="weaviate">Weaviate URL</Label>
                <Input
                  id="weaviate"
                  value={integrationSettings.weaviateUrl}
                  onChange={e =>
                    setIntegrationSettings({
                      ...integrationSettings,
                      weaviateUrl: e.target.value,
                    })
                  }
                  placeholder="http://localhost:8080"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => fetchSettings()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Keys
                </Button>
                <Button
                  onClick={() => saveSettings('Integrations')}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Integration Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable application features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Transcription</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable real-time meeting transcription
                    </p>
                  </div>
                  <Switch
                    checked={features.transcriptionEnabled}
                    onCheckedChange={checked =>
                      setFeatures({
                        ...features,
                        transcriptionEnabled: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI Analysis</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable AI-powered coaching analysis
                    </p>
                  </div>
                  <Switch
                    checked={features.aiAnalysisEnabled}
                    onCheckedChange={checked =>
                      setFeatures({ ...features, aiAnalysisEnabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Personal AI Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable Personal AI memory integration
                    </p>
                  </div>
                  <Switch
                    checked={features.personalAiIntegration}
                    onCheckedChange={checked =>
                      setFeatures({
                        ...features,
                        personalAiIntegration: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Real-time Transcripts</Label>
                    <p className="text-sm text-muted-foreground">
                      Show transcripts in real-time during sessions
                    </p>
                  </div>
                  <Switch
                    checked={features.realtimeTranscripts}
                    onCheckedChange={checked =>
                      setFeatures({ ...features, realtimeTranscripts: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Beta Features</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Client Portal</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable client self-service portal
                    </p>
                  </div>
                  <Switch
                    checked={features.clientPortal}
                    onCheckedChange={checked =>
                      setFeatures({ ...features, clientPortal: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Advanced Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable advanced analytics dashboard
                    </p>
                  </div>
                  <Switch
                    checked={features.advancedAnalytics}
                    onCheckedChange={checked =>
                      setFeatures({ ...features, advancedAnalytics: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Export Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow exporting session reports
                    </p>
                  </div>
                  <Switch
                    checked={features.exportReports}
                    onCheckedChange={checked =>
                      setFeatures({ ...features, exportReports: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bulk Operations</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable bulk client and session operations
                    </p>
                  </div>
                  <Switch
                    checked={features.bulkOperations}
                    onCheckedChange={checked =>
                      setFeatures({ ...features, bulkOperations: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveSettings('Features')}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Feature Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure email server and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={e =>
                      setEmailSettings({
                        ...emailSettings,
                        smtpHost: e.target.value,
                      })
                    }
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={e =>
                      setEmailSettings({
                        ...emailSettings,
                        smtpPort: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={e =>
                      setEmailSettings({
                        ...emailSettings,
                        smtpUser: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPass">SMTP Password</Label>
                  <Input
                    id="smtpPass"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={e =>
                      setEmailSettings({
                        ...emailSettings,
                        smtpPassword: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={e =>
                      setEmailSettings({
                        ...emailSettings,
                        fromEmail: e.target.value,
                      })
                    }
                    placeholder="noreply@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={e =>
                      setEmailSettings({
                        ...emailSettings,
                        fromName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications to users
                  </p>
                </div>
                <Switch
                  checked={emailSettings.enableEmailNotifications}
                  onCheckedChange={checked =>
                    setEmailSettings({
                      ...emailSettings,
                      enableEmailNotifications: checked,
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Test Email Configuration</Button>
                <Button onClick={() => saveSettings('Email')} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security policies and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={e =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={e =>
                      setSecuritySettings({
                        ...securitySettings,
                        maxLoginAttempts: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Password Policy</h3>
                <div className="space-y-2">
                  <Label htmlFor="minLength">Minimum Password Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={e =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordMinLength: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase Letters</Label>
                    <Switch
                      checked={securitySettings.requireUppercase}
                      onCheckedChange={checked =>
                        setSecuritySettings({
                          ...securitySettings,
                          requireUppercase: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch
                      checked={securitySettings.requireNumbers}
                      onCheckedChange={checked =>
                        setSecuritySettings({
                          ...securitySettings,
                          requireNumbers: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Special Characters</Label>
                    <Switch
                      checked={securitySettings.requireSpecialChars}
                      onCheckedChange={checked =>
                        setSecuritySettings({
                          ...securitySettings,
                          requireSpecialChars: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all users
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.enableTwoFactor}
                    onCheckedChange={checked =>
                      setSecuritySettings({
                        ...securitySettings,
                        enableTwoFactor: checked,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                  <Textarea
                    id="ipWhitelist"
                    value={securitySettings.ipWhitelist}
                    onChange={e =>
                      setSecuritySettings({
                        ...securitySettings,
                        ipWhitelist: e.target.value,
                      })
                    }
                    placeholder="Enter IP addresses, one per line"
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty to allow all IP addresses
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveSettings('Security')}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
