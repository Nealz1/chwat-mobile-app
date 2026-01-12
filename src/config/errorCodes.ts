
export const AUTH_ERROR_CODES = {
    USOS_LOGOUT: 'usos_logout',
    USER_INFO_FAILED: 'user_info_failed',
    INVALID_TOKEN: 'invalid_token',
    SESSION_EXPIRED: 'session_expired',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];
