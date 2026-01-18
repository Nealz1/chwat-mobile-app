
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';

export interface StreamEvent {
    type: 'start' | 'token' | 'done' | 'error' | 'status' | 'step';
    content?: string;
    message?: string;
    full_response?: string;
    session_id?: number;
    file_download?: {
        filename: string;
        path: string;
    };
}

export interface StreamOptions {
    message: string;
    sessionId?: number | null;
    onStart?: () => void;
    onToken?: (token: string) => void;
    onDone?: (fullResponse: string, sessionId?: number) => void;
    onError?: (error: string) => void;
    onStatus?: (status: string) => void;
    onStep?: (step: string) => void;
    onFileDownload?: (filename: string, path: string) => void;
    abortController?: AbortController;
    useAgents?: boolean;
}

export async function streamChatResponse(options: StreamOptions): Promise<void> {
    const {
        message,
        sessionId,
        onStart,
        onToken,
        onDone,
        onError,
        onStatus,
        onStep,
        onFileDownload,
        abortController,
        useAgents = false,
    } = options;

    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const endpoint = useAgents ? '/chat/stream/agents' : '/chat/stream';

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                message,
                session_id: typeof sessionId === 'number' ? sessionId : null,
            }),
            signal: abortController?.signal,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        onStart?.();

        const text = await response.text();
        const lines = text.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const eventData: StreamEvent = JSON.parse(line.slice(6));

                    switch (eventData.type) {
                        case 'start':
                            break;
                        case 'token':
                            if (eventData.content) {
                                onToken?.(eventData.content);
                            }
                            break;
                        case 'done':
                            onDone?.(eventData.full_response || '', eventData.session_id);
                            if (eventData.file_download && onFileDownload) {
                                onFileDownload(eventData.file_download.filename, eventData.file_download.path);
                            }
                            break;
                        case 'error':
                            onError?.(eventData.message || 'Unknown error');
                            break;
                        case 'status':
                            onStatus?.(eventData.message || '');
                            break;
                        case 'step':
                            onStep?.((eventData as unknown as { step: string }).step || '');
                            break;
                    }
                } catch (parseError) {
                    console.warn('Failed to parse SSE event:', line, parseError);
                }
            }
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onError?.(errorMessage);
    }
}

export function isStreamingSupported(): boolean {
    return typeof ReadableStream !== 'undefined' && typeof TextDecoder !== 'undefined';
}

export async function sendChatMessageFallback(
    message: string,
    sessionId?: number | null
): Promise<{ response: string; sessionId?: number }> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            message,
            session_id: typeof sessionId === 'number' ? sessionId : null,
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
        response: data.response || data.message || '',
        sessionId: data.session_id,
    };
}
