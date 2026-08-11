import { Label, Switch } from 'coach-sidekick'

export const Default = () => (
  <div className="flex items-center gap-2">
    <Switch id="switch-auto-deploy" defaultChecked />
    <Label htmlFor="switch-auto-deploy">
      Auto-deploy bot to calendar meetings
    </Label>
  </div>
)

export const States = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Switch id="switch-state-on" defaultChecked />
      <Label htmlFor="switch-state-on">Session reminders</Label>
    </div>
    <div className="flex items-center gap-2">
      <Switch id="switch-state-off" />
      <Label htmlFor="switch-state-off">Weekly digest</Label>
    </div>
    <div className="flex items-center gap-2">
      <Switch id="switch-state-disabled-on" disabled defaultChecked />
      <Label htmlFor="switch-state-disabled-on">
        Recording (required by workspace)
      </Label>
    </div>
    <div className="flex items-center gap-2">
      <Switch id="switch-state-disabled-off" disabled />
      <Label htmlFor="switch-state-disabled-off">
        Live coaching cues (upgrade to enable)
      </Label>
    </div>
  </div>
)

export const SettingsList = () => (
  <div className="max-w-md divide-y divide-line rounded-md border border-line">
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="space-y-1">
        <Label htmlFor="switch-setting-summaries">Share summaries</Label>
        <p className="text-sm text-ink-3">
          Clients see AI-generated summaries in their portal.
        </p>
      </div>
      <Switch id="switch-setting-summaries" defaultChecked />
    </div>
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="space-y-1">
        <Label htmlFor="switch-setting-thrill">Post-session Thrill Form</Label>
        <p className="text-sm text-ink-3">
          Send a short questionnaire after each 1-on-1 session.
        </p>
      </div>
      <Switch id="switch-setting-thrill" defaultChecked />
    </div>
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="space-y-1">
        <Label htmlFor="switch-setting-autobot">Auto-deploy bot</Label>
        <p className="text-sm text-ink-3">
          Join scheduled meetings automatically with the recording bot.
        </p>
      </div>
      <Switch id="switch-setting-autobot" />
    </div>
  </div>
)
