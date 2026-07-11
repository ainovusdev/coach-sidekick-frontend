// Single source of truth for the Proficiency Ladder rubric UI (trainee vs graduate).
// Keys MUST match the backend (app/schemas/analysis.py PROFICIENCY_CRITERIA and
// app/services/proficiency_analysis_service.py CRITERIA_ANCHORS).

import {
  Target,
  Eye,
  Shield,
  Users,
  Brain,
  Sparkles,
  Zap,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'

export type ProficiencyCriterionKey =
  | 'maximum_value'
  | 'expansion'
  | 'integrity'
  | 'agency'
  | 'listening'
  | 'reinvention'
  | 'energy'
  | 'disruption'

// Rung index (1..7) -> short display name. Rung 4 is the graduation "bar".
export const RUNG_NAMES: Record<number, string> = {
  1: 'Ineffective',
  2: 'Emerging',
  3: 'Foundational',
  4: 'Proficient',
  5: 'Intermediate',
  6: 'Advanced',
  7: 'Elite',
}

export const PROFICIENT_RUNG = 4 // the bar

export interface ProficiencyCriterionConfig {
  key: ProficiencyCriterionKey
  label: string
  icon: LucideIcon
  // Short anchor text per rung (1..7), used for tooltips / expandable detail.
  anchors: Record<number, string>
}

export const PROFICIENCY_CRITERIA: ProficiencyCriterionConfig[] = [
  {
    key: 'maximum_value',
    label: 'Maximum Value',
    icon: Target,
    anchors: {
      1: 'Conversation stays reactive, scattered, or problem-focused.',
      2: 'Attempts to establish value; accepts the first answer at face value.',
      3: 'Co-creates a workable outcome for the conversation.',
      4: 'Establishes and maintains a specific Max Value aligned with the vision.',
      5: 'Advocates for a higher-value opportunity and sets it before exploring gaps.',
      6: 'Consistently advocates for the highest-leverage developmental opportunity.',
      7: 'Reveals and advances value opportunities that were invisible to the client.',
    },
  },
  {
    key: 'expansion',
    label: 'Expansion',
    icon: Eye,
    anchors: {
      1: "Accepts the client's frame without testing its limits.",
      2: 'Occasional, inconsistent invitations beyond a self-imposed limitation.',
      3: 'Reliably surfaces limiting assumptions; client sees more choice.',
      4: 'Inquiry consistently expands identity, capability, and possibility.',
      5: "Invites the client to test their intuition about what's possible.",
      6: 'Generates transformational shifts across multiple domains of life.',
      7: 'Makes previously unbelievable possibilities available — client acts on them.',
    },
  },
  {
    key: 'integrity',
    label: 'Integrity',
    icon: Shield,
    anchors: {
      1: 'Leaves word/action misalignment unaddressed.',
      2: 'Identifies explicit instances of being out of alignment with their word.',
      3: 'Consistently surfaces gaps between commitments and behavior.',
      4: 'Develops capacity to honor their word and restore workability.',
      5: 'Reveals and dismantles the rackets behind out-of-integrity behavior.',
      6: 'Transforms their relationship to their word as a source of power.',
      7: 'Coaches the client’s relationship to themselves as their word.',
    },
  },
  {
    key: 'agency',
    label: 'Agency',
    icon: Users,
    anchors: {
      1: 'Reinforces a relationship of dependence.',
      2: 'Empowerment attempts via rescuing and over-functioning.',
      3: 'Frequently returns responsibility to the client.',
      4: "Develops the client's capacity for self-leadership.",
      5: 'Invites greater coachability and ownership of resourcefulness.',
      6: 'Full participation is the central conversation in the call.',
      7: 'Client shapes the coaching relationship itself toward their vision.',
    },
  },
  {
    key: 'listening',
    label: 'Listening',
    icon: Brain,
    anchors: {
      1: 'Listens to respond; misses cues, contradictions, emotional shifts.',
      2: 'Intermittent attention; drifts into fixing/teaching. Level 1.',
      3: 'Level 2 active listening; restates content, some silence.',
      4: 'Sustains active listening + self-management; some global listening.',
      5: 'Frequently reaches Level 3; notices subtle shifts (sometimes retreats).',
      6: 'Level 3 as a reliable way of being; surfaces hidden dynamics.',
      7: 'Listening itself is a transformational intervention.',
    },
  },
  {
    key: 'reinvention',
    label: 'Reinvention',
    icon: Sparkles,
    anchors: {
      1: 'Stays at circumstance/behavior; never explores who to become.',
      2: 'Mostly things-to-do; rare, undeveloped identity questions.',
      3: 'Invites alternative ways of being, but it stays theoretical.',
      4: 'Helps articulate new possibilities for who they could become.',
      5: 'Moves clients from insight into declaration & commitment.',
      6: 'Client participates in reinvention live — shifts in real time.',
      7: "Reinvents self in the call to advocate for the client's becoming.",
    },
  },
  {
    key: 'energy',
    label: 'Energy',
    icon: Zap,
    anchors: {
      1: "Energies are 'off'; discernible mistrust.",
      2: 'Prepared but the call feels overly structured or rigid.',
      3: 'Prepared with some flow; transitions can feel abrupt.',
      4: 'Inviting, neutral, curious; natural flow with smooth transitions.',
      5: 'Intentionally plays diverse energies; reliably lifts engagement.',
      6: 'Discerns and evokes the energy transformation requires.',
      7: 'Becomes whoever they must to unlock trajectory-shifting growth.',
    },
  },
  {
    key: 'disruption',
    label: 'Disruption',
    icon: MessageSquare,
    anchors: {
      1: 'Tolerates narratives/excuses; never leverages them.',
      2: 'Alludes to disruption but does not hold the space in the moment.',
      3: 'Interrupts patterns directly; some new awareness emerges.',
      4: 'Disrupts interpretations/identity claims live; hidden things become seen.',
      5: 'Disrupts strategically, tailored to the limiting constraint.',
      6: 'Disrupts the deeper structure; steady through resistance.',
      7: 'Disruption is seamless; client disrupts their own narratives.',
    },
  },
]

// How the trainee/graduate curve maps a rung to a score (for the legend).
export const RUBRIC_LEGEND: Record<'trainee' | 'graduate', string> = {
  trainee:
    'Trainee scale: rungs 1–4 score as-is (1–4); above the bar earns a bonus (5→6.5, 6→7.8, 7→9.1).',
  graduate:
    'Graduate scale: at/above the bar scores as the rung (4–7); below the bar is penalized (3→−1, 2→−2, 1→−3).',
}
