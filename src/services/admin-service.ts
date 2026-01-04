import axiosInstance from '@/lib/axios-config'

// Types
export interface User {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  is_superuser: boolean
  roles: string[]
  client_count: number
  created_at: string
  deleted_at?: string | null // NEW: Soft delete timestamp
  deleted_by?: string | null // NEW: Who deleted the user
}

export interface RoleAssignment {
  user_id: string
  roles: string[]
}

export interface ClientAccess {
  client_id: string
  user_id: string
  access_level: 'full' | 'readonly'
}

export interface ClientAccessMatrix {
  client_id: string
  client_name: string
  assigned_users: {
    user_id: string
    email: string
    full_name: string | null
    roles: string[]
    access_level: string
    is_owner?: boolean
  }[]
}

export interface AuditLogEntry {
  id: string
  user_id: string
  user_email: string
  user_name?: string | null
  resource_type: string
  resource_id: string | null
  action: string
  details?: any
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

class AdminService {
  private static instance: AdminService

  private constructor() {}

  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService()
    }
    return AdminService.instance
  }

  // User Management
  async getUsers(params?: {
    skip?: number
    limit?: number
    search?: string
    role_filter?: string
    include_deleted?: boolean // NEW: Include soft-deleted users
  }): Promise<User[]> {
    const response = await axiosInstance.get('/admin/users', { params })
    return response.data
  }

  async getUser(userId: string): Promise<User> {
    const response = await axiosInstance.get(`/admin/users/${userId}`)
    return response.data
  }

  async createUser(data: {
    email: string
    password: string
    full_name?: string
    roles?: string[]
    is_active?: boolean
  }): Promise<User> {
    const response = await axiosInstance.post('/admin/users', data)
    return response.data
  }

  async updateUser(
    userId: string,
    data: {
      email?: string
      full_name?: string
      is_active?: boolean
      password?: string
    },
  ): Promise<User> {
    const response = await axiosInstance.put(`/admin/users/${userId}`, data)
    return response.data
  }

  async deleteUser(userId: string): Promise<void> {
    await axiosInstance.delete(`/admin/users/${userId}`)
  }

  // NEW: Restore soft-deleted user
  async restoreUser(userId: string): Promise<{ message: string; user: any }> {
    const response = await axiosInstance.post(`/admin/users/${userId}/restore`)
    return response.data
  }

  // Role Management
  async getAvailableRoles(): Promise<{
    roles: string[]
    descriptions: Record<string, string>
  }> {
    const response = await axiosInstance.get('/admin/roles/available')
    return response.data
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const response = await axiosInstance.get(`/admin/roles/user/${userId}`)
    return response.data
  }

  async assignRoles(userId: string, roles: string[]): Promise<void> {
    await axiosInstance.post('/admin/roles/assign', {
      user_id: userId,
      roles,
    })
  }

  async addRole(userId: string, role: string): Promise<void> {
    await axiosInstance.post(`/admin/roles/add/${userId}/${role}`)
  }

  async removeRole(userId: string, role: string): Promise<void> {
    await axiosInstance.delete(`/admin/roles/remove/${userId}/${role}`)
  }

  // Client Access Management
  async getAccessMatrix(params?: {
    skip?: number
    limit?: number
  }): Promise<ClientAccessMatrix[]> {
    const response = await axiosInstance.get('/admin/client-access/matrix', {
      params,
    })
    return response.data
  }

  async getUserClientAccess(userId: string): Promise<
    {
      client_id: string
      client_name: string
      access_level: string
      is_admin_access?: boolean
    }[]
  > {
    const response = await axiosInstance.get(
      `/admin/client-access/user/${userId}`,
    )
    return response.data
  }

  async getClientUserAccess(clientId: string): Promise<
    {
      user_id: string
      email: string
      full_name: string | null
      roles: string[]
      access_level: string
      granted_at?: string
      is_admin_access?: boolean
    }[]
  > {
    const response = await axiosInstance.get(
      `/admin/client-access/client/${clientId}`,
    )
    return response.data
  }

  async grantClientAccess(data: {
    client_id: string
    user_id: string
    access_level?: 'full' | 'readonly'
  }): Promise<void> {
    await axiosInstance.post('/admin/client-access/grant', data)
  }

  async bulkAssignClients(data: {
    user_id: string
    client_ids: string[]
    access_level?: 'full' | 'readonly'
  }): Promise<{
    message: string
    assigned_count: number
  }> {
    const response = await axiosInstance.post(
      '/admin/client-access/bulk-assign',
      data,
    )
    return response.data
  }

  async revokeClientAccess(clientId: string, userId: string): Promise<void> {
    await axiosInstance.delete(
      `/admin/client-access/revoke/${clientId}/${userId}`,
    )
  }

  // Access Management Methods
  async getClientsForAssignment(userId: string): Promise<any[]> {
    const response = await axiosInstance.get(
      `/access/clients-for-assignment/${userId}`,
    )
    return response.data
  }

  async assignClientAccess(data: {
    client_id: string
    user_id: string
    access_level: string
  }): Promise<any> {
    const response = await axiosInstance.post('/access/client-access', data)
    return response.data
  }

  async removeClientAccess(clientId: string, userId: string): Promise<void> {
    await axiosInstance.delete(`/access/client-access/${clientId}/${userId}`)
  }

  async getAuditLog(params?: {
    limit?: number
    resource_type?: string
    user_id?: string
    action?: string
    start_date?: string
    end_date?: string
  }): Promise<AuditLogEntry[]> {
    const response = await axiosInstance.get('/access/audit-log', { params })
    return response.data
  }

  // Coach Access Management
  async assignCoachToAdmin(
    coachUserId: string,
    adminUserId: string,
  ): Promise<{
    id: string
    admin_user_id: string
    coach_user_id: string
    granted_by: string
    granted_at: string
    coach_email?: string
    admin_email?: string
  }> {
    const response = await axiosInstance.post('/access/coach-access', {
      coach_user_id: coachUserId,
      admin_user_id: adminUserId,
    })
    return response.data
  }

  async removeCoachFromAdmin(
    coachUserId: string,
    adminUserId: string,
  ): Promise<void> {
    await axiosInstance.delete(
      `/access/coach-access/${coachUserId}/${adminUserId}`,
    )
  }

  async getAllCoachAccess(): Promise<
    {
      id: string
      admin_user_id: string
      coach_user_id: string
      granted_by: string
      granted_at: string
      coach_email?: string
      admin_email?: string
    }[]
  > {
    const response = await axiosInstance.get('/access/coach-access')
    return response.data
  }

  async getUsersByRole(role: string): Promise<
    {
      id: string
      email: string
      full_name: string | null
      roles: string[]
    }[]
  > {
    const response = await axiosInstance.get(`/access/users-by-role/${role}`)
    return response.data
  }

  // Coach Invitation Management
  async sendCoachInvitation(email: string): Promise<CoachInvitation> {
    const response = await axiosInstance.post('/admin/coach-invitations', {
      email,
    })
    return response.data
  }

  async getCoachInvitations(): Promise<CoachInvitation[]> {
    const response = await axiosInstance.get('/admin/coach-invitations')
    return response.data
  }

  async revokeCoachInvitation(invitationId: string): Promise<void> {
    await axiosInstance.delete(`/admin/coach-invitations/${invitationId}`)
  }

  async resendCoachInvitation(invitationId: string): Promise<{
    message: string
    expires_at: string
  }> {
    const response = await axiosInstance.post(
      `/admin/coach-invitations/${invitationId}/resend`,
    )
    return response.data
  }
}

// Coach Invitation Types
export interface CoachInvitation {
  id: string
  email: string
  invited_by_name: string | null
  expires_at: string
  created_at: string
  accepted_at: string | null
  status: 'pending' | 'accepted' | 'expired'
}

export const adminService = AdminService.getInstance()
