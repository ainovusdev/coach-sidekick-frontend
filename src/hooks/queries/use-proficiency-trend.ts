import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import {
  AnalysisService,
  type ProficiencyTrendResponse,
} from '@/services/analysis-service'
import {
  useInsightViewer,
  withSandboxViewer,
} from '@/hooks/queries/use-sandbox-insights'

/**
 * Every scored session the viewer coached, fetched once; the dashboard card
 * filters it client-side, so changing a filter never refetches.
 */
export function useProficiencyTrend() {
  const viewer = useInsightViewer()
  return useQuery<ProficiencyTrendResponse>({
    queryKey: queryKeys.proficiency.trend(viewer ?? ''),
    queryFn: () =>
      withSandboxViewer(viewer, () => AnalysisService.getProficiencyTrend()),
    enabled: !!viewer,
    // Scores only change when a new session is analysed.
    staleTime: 10 * 60 * 1000,
  })
}
