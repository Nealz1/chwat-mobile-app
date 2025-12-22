// API Configuration - Update this to your backend URL
export const API_BASE_URL = 'http://192.168.101.2:8000';

// AsyncStorage Keys (previously localStorage keys)
export const STORAGE_KEYS = {
    DARK_MODE: 'darkMode',
    AUTH_TOKEN: 'auth_token',
    LANGUAGE: 'language',
    CURRENT_SESSION: 'currentSessionId',
    DRAFT_MESSAGE: 'draft_message',
    GUEST_MESSAGES: 'guest_messages',
} as const;

export const UI_FEEDBACK_DURATIONS = {
    COPY_SUCCESS: 800,
    TOAST_MESSAGE: 3000,
} as const;
