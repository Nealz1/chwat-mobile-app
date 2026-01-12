
export const formatRelativeDate = (dateStr: string, language: 'en' | 'pl' = 'en'): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return language === 'pl' ? 'Dzisiaj' : 'Today';
    if (diffDays === 1) return language === 'pl' ? 'Wczoraj' : 'Yesterday';
    if (diffDays < 7) return language === 'pl' ? `${diffDays} dni temu` : `${diffDays} days ago`;
    return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US');
};

export const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const isToday = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

export const isWithinDays = (dateStr: string, days: number): boolean => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays <= days;
};
