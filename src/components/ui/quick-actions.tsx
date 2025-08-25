import { Card, CardContent, CardHeader, CardTitle } from './card'
import { ActionButton } from './action-button'
import { LucideIcon } from 'lucide-react'

interface QuickAction {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
}

interface QuickActionsProps {
  title?: string
  actions: QuickAction[]
}

export function QuickActions({ title = 'Quick Actions', actions }: QuickActionsProps) {
  return (
    <Card className="border-neutral-200">
      <CardHeader>
        <CardTitle className="text-base font-medium text-neutral-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action, index) => (
          <ActionButton
            key={index}
            label={action.label}
            icon={action.icon}
            onClick={action.onClick}
            disabled={action.disabled}
            fullWidth
            className="justify-between"
            iconPosition="left"
          />
        ))}
      </CardContent>
    </Card>
  )
}