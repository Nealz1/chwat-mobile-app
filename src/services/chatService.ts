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
}

export const chatService = new ChatService();
