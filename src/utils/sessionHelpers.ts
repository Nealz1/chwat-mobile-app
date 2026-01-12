
import type { ChatSession } from '../types';

export interface GroupedSessions {
    today: ChatSession[];
    yesterday: ChatSession[];
    lastWeek: ChatSession[];
    lastMonth: ChatSession[];
    older: ChatSession[];
}

export const groupSessionsByDate = (sessions: ChatSession[]): GroupedSessions => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    const grouped: GroupedSessions = {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
    };

    sessions.forEach(session => {
        const sessionDate = new Date(session.updated_at);
        const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

        if (sessionDay.getTime() === today.getTime()) {
            grouped.today.push(session);
        } else if (sessionDay.getTime() === yesterday.getTime()) {
            grouped.yesterday.push(session);
        } else if (sessionDay > lastWeek) {
            grouped.lastWeek.push(session);
        } else if (sessionDay > lastMonth) {
            grouped.lastMonth.push(session);
        } else {
            grouped.older.push(session);
        }
    });

    return grouped;
};

export const sortSessionsByDate = (sessions: ChatSession[]): ChatSession[] => {
    return [...sessions].sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
};

export const filterSessionsByQuery = (sessions: ChatSession[], query: string): ChatSession[] => {
    if (!query.trim()) return sessions;
    const lowerQuery = query.toLowerCase();
    return sessions.filter(session =>
        session.title.toLowerCase().includes(lowerQuery)
    );
};

export const sortWithPinnedFirst = (sessions: ChatSession[]): ChatSession[] => {
    const pinned = sessions.filter(s => s.is_pinned);
    const unpinned = sessions.filter(s => !s.is_pinned);
    return [...sortSessionsByDate(pinned), ...sortSessionsByDate(unpinned)];
};
