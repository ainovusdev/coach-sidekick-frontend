import { Progress } from 'coach-sidekick'

const Row = ({
  label,
  value,
  valueClass = 'text-ink-4',
}: {
  label: string
  value: number
  valueClass?: string
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-2">{label}</span>
      <span className={valueClass}>{value}%</span>
    </div>
    <Progress value={value} />
  </div>
)

export const EngagementTracking = () => (
  <div className="w-80 space-y-5">
    <Row label="3 of 12 commitments completed" value={25} />
    <Row label="12 of 20 sessions completed" value={60} />
    <Row label="Q3 sprint — 9 of 10 check-ins" value={90} />
  </div>
)

export const Complete = () => (
  <div className="w-80">
    <Row
      label="20 of 20 sessions completed"
      value={100}
      valueClass="font-medium text-forest"
    />
  </div>
)
