import { ApiClient } from '@/lib/api-client'
import {
  Program,
  ProgramCreate,
  ProgramUpdate,
  ProgramListResponse,
  ProgramMembership,
  ProgramDashboard,
  TrendAnalysis,
  ProgramActionItems,
  ProgramCalendar,
  ThemeAnalysis,
} from '@/types/program'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export class ProgramService {
  static async listPrograms(params?: {
    page?: number
    per_page?: number
    search?: string
  }): Promise<ProgramListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page)
      queryParams.append('per_page', params.per_page.toString())
    if (params?.search) queryParams.append('search', params.search)

    const url = `${BACKEND_URL}/programs/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    return await ApiClient.get(url)
  }

  static async getProgram(programId: string): Promise<Program> {
    return await ApiClient.get(`${BACKEND_URL}/programs/${programId}`)
  }

  static async createProgram(data: ProgramCreate): Promise<Program> {
    return await ApiClient.post(`${BACKEND_URL}/programs/`, data)
  }

  static async updateProgram(
    programId: string,
    data: ProgramUpdate,
  ): Promise<Program> {
    return await ApiClient.patch(`${BACKEND_URL}/programs/${programId}`, data)
  }

  static async deleteProgram(programId: string): Promise<void> {
    await ApiClient.delete(`${BACKEND_URL}/programs/${programId}`)
  }

  static async addClientsToProgram(
    programId: string,
    clientIds: string[],
  ): Promise<ProgramMembership[]> {
    return await ApiClient.post(
      `${BACKEND_URL}/programs/${programId}/clients`,
      {
        client_ids: clientIds,
      },
    )
  }

  static async removeClientFromProgram(
    programId: string,
    clientId: string,
  ): Promise<void> {
    await ApiClient.delete(
      `${BACKEND_URL}/programs/${programId}/clients/${clientId}`,
    )
  }

  static async getProgramDashboard(
    programId: string,
  ): Promise<ProgramDashboard> {
    return await ApiClient.get(`${BACKEND_URL}/programs/${programId}/dashboard`)
  }

  static async getProgramTrends(
    programId: string,
    days: number = 90,
  ): Promise<TrendAnalysis> {
    return await ApiClient.get(
      `${BACKEND_URL}/programs/${programId}/trends?days=${days}`,
    )
  }

  static async getProgramActionItems(
    programId: string,
    statusFilter?: 'pending' | 'completed' | 'overdue',
  ): Promise<ProgramActionItems> {
    const queryParams = statusFilter ? `?status_filter=${statusFilter}` : ''
    return await ApiClient.get(
      `${BACKEND_URL}/programs/${programId}/action-items${queryParams}`,
    )
  }

  static async getProgramCalendar(
    programId: string,
    daysAhead: number = 30,
  ): Promise<ProgramCalendar> {
    return await ApiClient.get(
      `${BACKEND_URL}/programs/${programId}/calendar?days_ahead=${daysAhead}`,
    )
  }

  static async getProgramThemeAnalysis(
    programId: string,
    days: number = 90,
  ): Promise<ThemeAnalysis> {
    return await ApiClient.get(
      `${BACKEND_URL}/programs/${programId}/theme-analysis?days=${days}`,
    )
  }
}
