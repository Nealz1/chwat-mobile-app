
export const MESSAGE_SENDER = {
    USER: 'user' as const,
    BOT: 'bot' as const,
} as const;

export const NAVIGATION_DIRECTION = {
    PREV: 'prev' as const,
    NEXT: 'next' as const,
} as const;

export const FEEDBACK_TYPE = {
    POSITIVE: 'positive' as const,
    NEGATIVE: 'negative' as const,
    NEUTRAL: 'neutral' as const,
} as const;

export type MessageSender = typeof MESSAGE_SENDER[keyof typeof MESSAGE_SENDER];
export type NavigationDirection = typeof NAVIGATION_DIRECTION[keyof typeof NAVIGATION_DIRECTION];
export type FeedbackType = typeof FEEDBACK_TYPE[keyof typeof FEEDBACK_TYPE];
