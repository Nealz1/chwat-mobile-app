import { API_BASE_URL } from '../config/constants';
import { authService } from './authService';
import type { ChatSession } from '../types';

export interface Group {
    id: number;
    user_id: string;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    session_count?: number;
}

class GroupsService {
    async getGroups(): Promise<Group[]> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/api/groups`, {
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) return [];

            const data = await response.json();
            return data.groups || [];
        } catch (error) {
            console.error('Error fetching groups:', error);
            return [];
        }
    }

    async createGroup(name: string): Promise<Group | null> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/api/groups`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) return null;

            const data = await response.json();
            return data.group;
        } catch (error) {
            console.error('Error creating group:', error);
            return null;
        }
    }

    async deleteGroup(groupId: number): Promise<boolean> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}`, {
                method: 'DELETE',
                headers,
            });
            return response.ok;
        } catch (error) {
            console.error('Error deleting group:', error);
            return false;
        }
    }

    async getGroupSessions(groupId: number): Promise<ChatSession[]> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/sessions`, {
                headers,
            });

            if (!response.ok) return [];

            const data = await response.json();
            return data.sessions || [];
        } catch (error) {
            console.error('Error fetching group sessions:', error);
            return [];
        }
    }

    async addSessionToGroup(sessionId: number, groupId: number): Promise<boolean> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/groups`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ group_id: groupId }),
            });
            return response.ok;
        } catch (error) {
            console.error('Error adding session to group:', error);
            return false;
        }
    }

    async removeSessionFromGroup(sessionId: number): Promise<boolean> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/groups`, {
                method: 'DELETE',
                headers,
            });
            return response.ok;
        } catch (error) {
            console.error('Error removing session from group:', error);
            return false;
        }
    }

    // Search groups by query (for autocomplete)
    async searchGroups(query: string, limit: number = 5): Promise<string[]> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/api/groups/search?q=${encodeURIComponent(query)}&limit=${limit}`,
                { headers }
            );

            if (!response.ok) return [];

            const data = await response.json();
            return data.groups || [];
        } catch (error) {
            console.error('Error searching groups:', error);
            return [];
        }
    }
}

export const groupsService = new GroupsService();
