import { API_BASE_URL } from '../config/constants';
import { authService } from './authService';
import type { ChatSession, Message } from '../types';

export interface ChatMessageResponse {
    role: string;
    content: string;
    created_at: string;
    node_id?: number;
}

export interface SendMessageResponse {
    response: string;
    session_id: number;
    node_id?: number;
}

class ChatService {
    async getSessions(includeArchived: boolean = false): Promise<ChatSession[]> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/chat/sessions?include_archived=${includeArchived}`,
                { headers }
            );

            if (!response.ok) return [];

            const data = await response.json();
            return data.sessions || [];
        } catch (error) {
            console.error('Error fetching sessions:', error);
            return [];
        }
    }

    async getSessionMessages(sessionId: number): Promise<ChatMessageResponse[]> {
        const headers = await authService.getAuthHeaders();
        const response = await fetch(
            `${API_BASE_URL}/chat/sessions/${sessionId}`,
            { headers }
        );

        if (!response.ok) {
            throw new Error('Session not found or access denied');
        }

        const data = await response.json();
        return data.messages || [];
    }

    async sendMessage(message: string, sessionId?: number): Promise<SendMessageResponse> {
        const headers = await authService.getAuthHeaders();

        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                session_id: sessionId,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        return await response.json();
    }

    async sendGuestMessage(message: string): Promise<{ response: string }> {
        const response = await fetch(`${API_BASE_URL}/guest/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            throw new Error('Failed to send guest message');
        }

        return await response.json();
    }

    async deleteSession(sessionId: number): Promise<boolean> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/chat/sessions/${sessionId}`,
                {
                    method: 'DELETE',
                    headers,
                }
            );

            return response.ok;
        } catch (error) {
            console.error('Error deleting session:', error);
            return false;
        }
    }

    async updateSessionTitle(sessionId: number, title: string): Promise<boolean> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/chat/sessions/${sessionId}/title`,
                {
                    method: 'PUT',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title }),
                }
            );

            return response.ok;
        } catch (error) {
            console.error('Error updating session title:', error);
            return false;
        }
    }

    // Archive/Unarchive
    async archiveSession(sessionId: number): Promise<boolean> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/chat/sessions/${sessionId}/archive`,
                {
                    method: 'POST',
                    headers,
                }
            );
            return response.ok;
        } catch (error) {
            console.error('Error archiving session:', error);
            return false;
        }
    }

    async unarchiveSession(sessionId: number): Promise<boolean> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/chat/sessions/${sessionId}/unarchive`,
                {
                    method: 'POST',
                    headers,
                }
            );
            return response.ok;
        } catch (error) {
            console.error('Error unarchiving session:', error);
            return false;
        }
    }

    // Pin/Unpin
    async pinSession(sessionId: number, isPinned: boolean): Promise<boolean> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/chat/sessions/${sessionId}/pin`,
                {
                    method: 'PUT',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ is_pinned: isPinned }),
                }
            );
            return response.ok;
        } catch (error) {
            console.error('Error pinning session:', error);
            return false;
        }
    }

    // Move session to group
    async moveToGroup(sessionId: number, groupId: number | null): Promise<boolean> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/chat/sessions/${sessionId}/group`,
                {
                    method: 'PUT',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ group_id: groupId }),
                }
            );
            return response.ok;
        } catch (error) {
            console.error('Error moving session to group:', error);
            return false;
        }
    }

    // Get groups list
    async getGroups(): Promise<{ id: number; name: string }[]> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/chat/groups`, { headers });
            if (!response.ok) return [];
            const data = await response.json();
            return data.groups || [];
        } catch (error) {
            console.error('Error fetching groups:', error);
            return [];
        }
    }

    // ==================== MESSAGE TREE/VERSIONING METHODS ====================

    // Get conversation tree with message versions
    async getConversationTree(sessionId: number): Promise<any[]> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/chat/sessions/${sessionId}/tree`,
                { headers }
            );
            if (!response.ok) return [];
            const data = await response.json();
            return data.tree || [];
        } catch (error) {
            console.error('Error fetching conversation tree:', error);
            return [];
        }
    }

    // Get sibling messages for version navigation
    async getMessageSiblings(nodeId: number): Promise<any[]> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/chat/messages/${nodeId}/siblings`,
                { headers }
            );
            if (!response.ok) return [];
            const data = await response.json();
            return data.siblings || [];
        } catch (error) {
            console.error('Error fetching message siblings:', error);
            return [];
        }
    }

    // Set active version of a message
    async setActiveVersion(sessionId: number, parentNodeId: number, childId: number): Promise<boolean> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/chat/sessions/${sessionId}/messages/${parentNodeId}/set-active`,
                {
                    method: 'POST',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ child_id: childId }),
                }
            );
            return response.ok;
        } catch (error) {
            console.error('Error setting active version:', error);
            return false;
        }
    }

    // Regenerate bot response (creates new version)
    async regenerateResponse(sessionId: number, parentNodeId: number): Promise<any> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/chat/sessions/${sessionId}/regenerate`,
                {
                    method: 'POST',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ parent_node_id: parentNodeId }),
                }
            );
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error regenerating response:', error);
            return null;
        }
    }

    // Edit user message (creates new branch)
    async editMessage(sessionId: number, nodeId: number, content: string): Promise<any> {
        try {
            const headers = await authService.getAuthHeaders();
            const response = await fetch(
                `${API_BASE_URL}/chat/sessions/${sessionId}/messages/${nodeId}/edit`,
                {
                    method: 'PUT',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content, node_id: nodeId }),
                }
            );
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error editing message:', error);
            return null;
        }
    }
}

export const chatService = new ChatService();
