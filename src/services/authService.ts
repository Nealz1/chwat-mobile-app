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
        await AsyncStorage.setItem(this.TOKEN_KEY, token);
    }

    async removeToken(): Promise<void> {
        await AsyncStorage.removeItem(this.TOKEN_KEY);
    }

    async loginWithOAuth(): Promise<string | null> {
        const redirectUrl = Linking.createURL('auth');

        const response = await fetch(
            `${API_BASE_URL}/usos/login?platform=mobile&redirect_uri=${encodeURIComponent(redirectUrl)}`
        );
        const data = await response.json();

        if (!data.auth_url) {
            throw new Error('No auth URL returned');
        }

        const result = await WebBrowser.openAuthSessionAsync(data.auth_url, redirectUrl);

        if (result.type === 'success' && result.url) {
            const match = result.url.match(/[?&]token=([^&]+)/);
            const token = match ? match[1] : null;

            if (token) {
                await this.setToken(token);
                return token;
            }
        }

        return null;
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
        } catch {
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
            } catch { }
        }

        await this.clearAllUserData();
    }

    async clearAllUserData(): Promise<void> {
        await AsyncStorage.multiRemove([
            this.TOKEN_KEY,
            STORAGE_KEYS.CURRENT_SESSION,
            STORAGE_KEYS.GUEST_MESSAGES,
        ]);
    }

    async getAuthHeaders(): Promise<Record<string, string>> {
        const token = await this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async submitFeedback(nodeId: number, feedback: string): Promise<void> {
        const token = await this.getToken();
        if (!token) return;

        await fetch(`${API_BASE_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ node_id: nodeId, feedback }),
        });
    }
}

export const authService = new AuthService();
