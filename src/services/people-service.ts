import { ApiClient } from '@/lib/api-client'
import type { PeopleSearchResponse, Person } from '@/types/people'

const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/people`

export class PeopleService {
  /** Whom may I assign to / mention, optionally in a context (client:<id> | sandbox:<id>). */
  static async search(
    q: string,
    context?: string,
    limit = 12,
  ): Promise<Person[]> {
    const params = new URLSearchParams({ q, limit: String(limit) })
    if (context) params.set('context', context)
    const res: PeopleSearchResponse = await ApiClient.get(
      `${BASE}/search?${params.toString()}`,
    )
    return res.people
  }
}
