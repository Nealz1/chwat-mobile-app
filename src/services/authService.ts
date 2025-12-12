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
     * OAuth login flow - opens USOS in browser
     * Returns true if login was successful
     */
    async login(): Promise<boolean> {
        try {
            // Get the redirect URL for the mobile app
            const redirectUrl = Linking.createURL('auth/callback');
            console.log('Redirect URL:', redirectUrl);

            // Get the USOS auth URL from our backend
            const response = await fetch(`${API_BASE_URL}/usos/login?redirect_uri=${encodeURIComponent(redirectUrl)}`);
            const data = await response.json();

            if (!data.auth_url) {
                console.error('No auth_url in response');
                return false;
            }

            // Open the browser for USOS login
            const result = await WebBrowser.openAuthSessionAsync(
                data.auth_url,
                redirectUrl
            );

            console.log('Auth result:', result);

            if (result.type === 'success' && result.url) {
                // Parse the token from the callback URL
                const url = new URL(result.url);
                const token = url.searchParams.get('token');

                if (token) {
                    await this.setToken(token);
                    const user = await this.getCurrentUser();
                    return !!user;
                }
            }

            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    /**
     * Alternative: Login by opening web app login page
     * User completes login in browser, then copies token
     */
    async loginViaWebApp(): Promise<void> {
        const webAppUrl = API_BASE_URL.replace(':8000', ':5173'); // Assuming Vite dev server
        await WebBrowser.openBrowserAsync(`${webAppUrl}?mobile_login=true`);
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
                // Notify backend of logout
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
}

export const authService = new AuthService();
