import type { ReportingDates } from './sandbox-analytics'
export interface InsightFinding {
  id: string
  theme: string
  title: string
  kind: 'working_on' | 'reported_practice' | 'barrier'
  description: string
  sessions: number
  coachees: number
  starts_on: string
  ends_on: string
  trend: {
    description: string
    direction: string
    matched_coachees: number
    earlier_sessions: number
    later_sessions: number
    earlier_evidence_sessions: number
    later_evidence_sessions: number
  } | null
}
export interface LearningResult {
  presentation_mode: 'aggregate' | 'personal' | 'named'
  status: 'ready' | 'insufficient_evidence'
  starts_on: string | null
  ends_on: string | null
  findings: InsightFinding[]
  suggestions: {
    theme: string
    description: string
    outcome_refs: string[]
    outcome_note: string | null
    destination: 'outcomes' | 'timeline'
  }[]
  coverage: { sessions: number; coachees: number; minimum_support: number }
  limitation: string
  extraction_version: string
}
export type InsightStatus =
  | 'never_generated'
  | 'queued'
  | 'generating'
  | 'ready'
  | 'insufficient_evidence'
  | 'stale'
  | 'failed'
  | 'invalidated'
export interface SandboxInsights {
  sandbox_id: string
  viewer_id: string
  my_scope: 'all' | 'groups' | 'self'
  presentation_mode: 'aggregate' | 'personal' | 'named'
  dates: ReportingDates
  selected_group_id: string | null
  selected_subject_member_id?: string | null
  selected_coach_user_id?: string | null
  selected_entity_kind?: 'client' | 'coach' | 'group' | null
  status: InsightStatus
  run: {
    id: string
    status: Exclude<InsightStatus, 'never_generated' | 'stale'>
    progress_done: number
    progress_total: number
    attempts: number
    failure_code: string | null
    created_at: string
    completed_at: string | null
  } | null
  result: LearningResult | null
  generated_at: string | null
  stale: boolean
  can_generate: boolean
}
