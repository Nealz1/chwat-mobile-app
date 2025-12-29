import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import type { User } from '../types';

class AuthService {
    private readonly TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;

    async getToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(this.TOKEN_KEY);
        } catch {
            return null;
        }
    }

    async setToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(this.TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving token:', error);
        }
    }

    async removeToken(): Promise<void> {
        try {
            await AsyncStorage.removeItem(this.TOKEN_KEY);
        } catch (error) {
            console.error('Error removing token:', error);
        }
    }

    /**
     * Opens USOS login in in-app browser (OAuth flow)
     * Returns the JWT token on success, null on failure/cancel
     */
    async loginWithOAuth(): Promise<string | null> {
        try {
            // Get the USOS auth URL from backend (with mobile platform)
            const response = await fetch(`${API_BASE_URL}/usos/login?platform=mobile`);
            const data = await response.json();

            if (!data.auth_url) {
                throw new Error('No auth URL returned');
            }

            // The redirect URL that USOS will return to
            const redirectUrl = Linking.createURL('auth');

            // Open auth session in in-app browser
            const result = await WebBrowser.openAuthSessionAsync(
                data.auth_url,
                redirectUrl
            );

            if (result.type === 'success' && result.url) {
                // Extract token from callback URL
                const url = new URL(result.url);
                const token = url.searchParams.get('token');

                if (token) {
                    await this.setToken(token);
                    return token;
                }
            }

            return null;
        } catch (error) {
            console.error('OAuth login error:', error);
            throw error;
        }
    }

    async getCurrentUser(): Promise<User | null> {
        const token = await this.getToken();
        if (!token) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                await this.removeToken();
                return null;
            }

            const data = await response.json();
            return data.user;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }

    async logout(): Promise<void> {
        const token = await this.getToken();

        if (token) {
            try {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
            } catch (error) {
                console.error('Error during logout:', error);
            }
        }

        await this.clearAllUserData();
    }

    async clearAllUserData(): Promise<void> {
        const keysToRemove = [
            this.TOKEN_KEY,
            STORAGE_KEYS.CURRENT_SESSION,
            STORAGE_KEYS.GUEST_MESSAGES,
        ];

        try {
            await AsyncStorage.multiRemove(keysToRemove);
            console.log('All user data cleared');
        } catch (error) {
            console.error('Error clearing user data:', error);
        }
    }

    async getAuthHeaders(): Promise<Record<string, string>> {
        const token = await this.getToken();
        return token
            ? { 'Authorization': `Bearer ${token}` }
            : {};
    }

    async submitFeedback(nodeId: number, feedback: string): Promise<void> {
        const token = await this.getToken();
        if (!token) return;

        try {
            await fetch(`${API_BASE_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ node_id: nodeId, feedback }),
            });
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    }
}

export const authService = new AuthService();
