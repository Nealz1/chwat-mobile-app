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
