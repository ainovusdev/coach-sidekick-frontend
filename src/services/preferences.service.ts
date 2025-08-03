import { ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface PreferencesData {
  coaching_preferences: string | null;
}

export interface PreferencesUpdateData {
  coaching_preferences: string;
}

export class PreferencesService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  static async getPreferences(): Promise<PreferencesData> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/preferences`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data: PreferencesData = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
  }

  static async updatePreferences(preferences: PreferencesUpdateData): Promise<PreferencesData> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/preferences`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data: PreferencesData = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }
}