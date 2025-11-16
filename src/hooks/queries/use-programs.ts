import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { ProgramService } from '@/services/program-service'
import {
  Program,
  ProgramCreate,
  ProgramUpdate,
  ProgramListResponse,
  ProgramDashboard,
  TrendAnalysis,
  ProgramActionItems,
  ProgramCalendar,
  ThemeAnalysis,
} from '@/types/program'
import { queryKeys, invalidateQueries, queryClient } from '@/lib/query-client'
import { toast } from 'sonner'

/**
 * Hook to fetch all programs list
 */
export function usePrograms(
  params?: {
    page?: number
    per_page?: number
    search?: string
  },
  options?: Omit<UseQueryOptions<ProgramListResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.programs.list(params),
    queryFn: () => ProgramService.listPrograms(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch a single program by ID
 */
export function useProgram(
  programId: string | undefined,
  options?: Omit<UseQueryOptions<Program>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery({
    queryKey: queryKeys.programs.detail(programId!),
    queryFn: () => ProgramService.getProgram(programId!),
    enabled: !!programId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch program dashboard data
 */
export function useProgramDashboard(
  programId: string | undefined,
  options?: Omit<
    UseQueryOptions<ProgramDashboard>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: queryKeys.programs.dashboard(programId!),
    queryFn: () => ProgramService.getProgramDashboard(programId!),
    enabled: !!programId,
    staleTime: 2 * 60 * 1000, // 2 minutes (fresher data for dashboard)
    ...options,
  })
}

/**
 * Hook to create a new program
 */
export function useCreateProgram(
  _options?: UseMutationOptions<Program, Error, ProgramCreate, unknown>,
) {
  return useMutation({
    mutationFn: (data: ProgramCreate) => ProgramService.createProgram(data),
    onSuccess: () => {
      invalidateQueries.afterProgramUpdate(queryClient)
      toast.success('Program created successfully')
    },
    onError: error => {
      toast.error('Failed to create program', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to update a program
 */
export function useUpdateProgram(
  _options?: UseMutationOptions<
    Program,
    Error,
    { programId: string; data: ProgramUpdate }
  >,
) {
  return useMutation({
    mutationFn: ({
      programId,
      data,
    }: {
      programId: string
      data: ProgramUpdate
    }) => ProgramService.updateProgram(programId, data),
    onSuccess: (data, variables) => {
      invalidateQueries.afterProgramUpdate(queryClient, variables.programId)
      toast.success('Program updated successfully')
    },
    onError: error => {
      toast.error('Failed to update program', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to delete a program
 */
export function useDeleteProgram(
  _options?: UseMutationOptions<void, Error, string>,
) {
  return useMutation({
    mutationFn: (programId: string) => ProgramService.deleteProgram(programId),
    onSuccess: () => {
      invalidateQueries.afterProgramUpdate(queryClient)
      toast.success('Program deleted successfully')
    },
    onError: error => {
      toast.error('Failed to delete program', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to add clients to a program
 */
export function useAddClientsToProgram(
  _options?: UseMutationOptions<
    any,
    Error,
    { programId: string; clientIds: string[] }
  >,
) {
  return useMutation<any, Error, { programId: string; clientIds: string[] }>({
    mutationFn: ({ programId, clientIds }) =>
      ProgramService.addClientsToProgram(programId, clientIds),
    onSuccess: (_data, variables) => {
      invalidateQueries.afterProgramUpdate(queryClient, variables.programId)
      toast.success('Clients added to program successfully')
    },
    onError: error => {
      toast.error('Failed to add clients to program', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to remove a client from a program
 */
export function useRemoveClientFromProgram(
  _options?: UseMutationOptions<
    void,
    Error,
    { programId: string; clientId: string }
  >,
) {
  return useMutation<void, Error, { programId: string; clientId: string }>({
    mutationFn: ({ programId, clientId }) =>
      ProgramService.removeClientFromProgram(programId, clientId),
    onSuccess: (_data, variables) => {
      invalidateQueries.afterProgramUpdate(queryClient, variables.programId)
      toast.success('Client removed from program successfully')
    },
    onError: error => {
      toast.error('Failed to remove client from program', {
        description: error.message,
      })
    },
  })
}

/**
 * Hook to fetch program trend analysis
 */
export function useProgramTrends(
  programId: string | undefined,
  days: number = 90,
  options?: Omit<
    UseQueryOptions<TrendAnalysis>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: [...queryKeys.programs.detail(programId!), 'trends', days],
    queryFn: () => ProgramService.getProgramTrends(programId!, days),
    enabled: !!programId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch program action items
 */
export function useProgramActionItems(
  programId: string | undefined,
  statusFilter?: 'pending' | 'completed' | 'overdue',
  options?: Omit<
    UseQueryOptions<ProgramActionItems>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.programs.detail(programId!),
      'action-items',
      statusFilter,
    ],
    queryFn: () =>
      ProgramService.getProgramActionItems(programId!, statusFilter),
    enabled: !!programId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Hook to fetch program calendar
 */
export function useProgramCalendar(
  programId: string | undefined,
  daysAhead: number = 30,
  options?: Omit<
    UseQueryOptions<ProgramCalendar>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: [...queryKeys.programs.detail(programId!), 'calendar', daysAhead],
    queryFn: () => ProgramService.getProgramCalendar(programId!, daysAhead),
    enabled: !!programId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch program theme analysis
 */
export function useProgramThemeAnalysis(
  programId: string | undefined,
  days: number = 90,
  options?: Omit<
    UseQueryOptions<ThemeAnalysis>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.programs.detail(programId!),
      'theme-analysis',
      days,
    ],
    queryFn: () => ProgramService.getProgramThemeAnalysis(programId!, days),
    enabled: !!programId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}
