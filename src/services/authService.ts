import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import type { User } from '../types';

class AuthService {
    private readonly TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;

    async getToken(): Promise<string | null> {
        return await AsyncStorage.getItem(this.TOKEN_KEY);
    }

    async setToken(token: string): Promise<void> {
        await AsyncStorage.setItem(this.TOKEN_KEY, token);
    }

    async removeToken(): Promise<void> {
        await AsyncStorage.removeItem(this.TOKEN_KEY);
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
            await this.removeToken();
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
                console.error('Error logging out:', error);
            }
        }

        await this.clearAllUserData();
    }

    async clearAllUserData(): Promise<void> {
        await AsyncStorage.multiRemove([
            this.TOKEN_KEY,
            STORAGE_KEYS.CURRENT_SESSION,
            STORAGE_KEYS.DRAFT_MESSAGE,
            STORAGE_KEYS.GUEST_MESSAGES,
        ]);
        console.log('✅ All user data cleared from AsyncStorage');
    }

    async getAuthHeaders(): Promise<HeadersInit> {
        const token = await this.getToken();
        if (!token) return {};
        return { 'Authorization': `Bearer ${token}` };
    }
}

export const authService = new AuthService();
export type { User };
