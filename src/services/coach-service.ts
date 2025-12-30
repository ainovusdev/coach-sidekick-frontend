import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://coach-sidekick-backend-production.up.railway.app/api/v1'

export interface Coach {
  id: string
  name: string
  email: string
  session_count: number
}

export interface CoachListResponse {
  coaches: Coach[]
  total: number
}

export class CoachService {
  static async listCoaches(): Promise<CoachListResponse> {
    return await ApiClient.get(`${BACKEND_URL}/coaches/`)
  }
}
