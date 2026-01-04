import { useMemo } from 'react'
import { useGoals } from './use-goals'
import { useTargets } from './use-targets'
import { useSprints } from './use-sprints'
import { Goal } from '@/services/goal-service'
import { Target, Sprint } from '@/types/sprint'

export interface OutcomeGroup {
  goal: Goal
  outcomes: Target[]
}

export interface GroupedOutcomesResult {
  groupedOutcomes: OutcomeGroup[]
  ungroupedOutcomes: Target[]
  allOutcomes: Target[]
  sprints: Sprint[]
  isLoading: boolean
  isError: boolean
}

/**
 * Hook to fetch outcomes grouped by their linked goals
 *
 * @param clientId - The client ID
 * @returns Outcomes grouped by goal, with sprints for display
 *
 * @example
 * const { groupedOutcomes, sprints, isLoading } = useOutcomesGroupedByGoal(clientId)
 */
export function useOutcomesGroupedByGoal(
  clientId: string | undefined,
): GroupedOutcomesResult {
  const { data: goals = [], isLoading: goalsLoading } = useGoals(clientId)
  const { data: allTargets = [], isLoading: targetsLoading } = useTargets()
  const { data: allSprints = [], isLoading: sprintsLoading } = useSprints({
    client_id: clientId,
  })

  const isLoading = goalsLoading || targetsLoading || sprintsLoading

  const { groupedOutcomes, ungroupedOutcomes, clientOutcomes } = useMemo(() => {
    if (!clientId || goals.length === 0) {
      return {
        groupedOutcomes: [],
        ungroupedOutcomes: [],
        clientOutcomes: [],
      }
    }

    // Get goal IDs for this client
    const goalIds = new Set(goals.map(g => g.id))

    // Filter targets that belong to this client (via goals)
    const clientTargets = allTargets.filter((t: Target) =>
      t.goal_ids?.some((gid: string) => goalIds.has(gid)),
    )

    // Group by first linked goal (primary goal)
    const grouped: Map<string, Target[]> = new Map()
    const ungrouped: Target[] = []

    for (const target of clientTargets) {
      if (target.goal_ids && target.goal_ids.length > 0) {
        const primaryGoalId = target.goal_ids[0]
        if (goalIds.has(primaryGoalId)) {
          const existing = grouped.get(primaryGoalId) || []
          grouped.set(primaryGoalId, [...existing, target])
        } else {
          ungrouped.push(target)
        }
      } else {
        ungrouped.push(target)
      }
    }

    // Convert to array of OutcomeGroup
    const result: OutcomeGroup[] = goals
      .map(goal => ({
        goal,
        outcomes: grouped.get(goal.id) || [],
      }))
      .filter(group => group.outcomes.length > 0)

    return {
      groupedOutcomes: result,
      ungroupedOutcomes: ungrouped,
      clientOutcomes: clientTargets,
    }
  }, [clientId, goals, allTargets])

  return {
    groupedOutcomes,
    ungroupedOutcomes,
    allOutcomes: clientOutcomes,
    sprints: allSprints,
    isLoading,
    isError: false,
  }
}

/**
 * Hook to filter outcomes by active sprint only
 */
export function useActiveSprintOutcomes(
  clientId: string | undefined,
): GroupedOutcomesResult {
  const result = useOutcomesGroupedByGoal(clientId)

  const filtered = useMemo(() => {
    const activeSprints = result.sprints.filter(s => s.status === 'active')
    const activeSprintIds = new Set(activeSprints.map(s => s.id))

    // Filter outcomes that are linked to any active sprint
    const activeOutcomes = result.allOutcomes.filter((o: Target) =>
      o.sprint_ids?.some((sid: string) => activeSprintIds.has(sid)),
    )

    // Re-group by goals
    const groupedOutcomes = result.groupedOutcomes
      .map(group => ({
        ...group,
        outcomes: group.outcomes.filter((o: Target) =>
          o.sprint_ids?.some((sid: string) => activeSprintIds.has(sid)),
        ),
      }))
      .filter(group => group.outcomes.length > 0)

    return {
      ...result,
      groupedOutcomes,
      allOutcomes: activeOutcomes,
    }
  }, [result])

  return filtered
}
