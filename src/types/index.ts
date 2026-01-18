export interface ThinkingStep {
    type: string;
    title: string;
    detail: string;
    duration_ms: number;
    agent: string | null;
    status: string;
}

export interface ThinkingStepsData {
    type: string;
    steps: ThinkingStep[];
    total_duration_ms: number;
}

export interface Suggestion {
    text: string;
    query: string;
    icon: string;
    category: string;
}

export interface SuggestionsData {
    type: string;
    suggestions: Suggestion[];
}

export interface Message {
    sender: "user" | "bot";
    text: string;
    nodeId?: number;
    parentId?: number | null;
    siblingCount?: number;
    currentIndex?: number;
    isLoading?: boolean;
    isStreaming?: boolean;
    feedback?: string | null;
    thinking_steps?: ThinkingStepsData;
    suggestions?: SuggestionsData;
    thinkingStep?: string;
}

export interface MessageNode {
    id: number;
    parent_id: number | null;
    role: string;
    content: string;
    created_at: string;
    sibling_count: number;
    current_index: number;
    feedback?: string | null;
}

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    student_status: number;
    staff_status: number;
    email_url: string;
}

export interface ChatSession {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
    is_pinned?: boolean;
    is_in_group?: boolean;
    user_id?: string;
    lastMessage?: string;
}

export type SessionId = number | string;
export type Language = "en" | "pl";
export type ThemeMode = "light" | "dark";
