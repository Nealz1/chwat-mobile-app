
import { Linking } from 'react-native';

export interface MessagePart {
    type: 'text' | 'link';
    content: string;
    url?: string;
    icon?: string;
}

export const parseMessageForLinks = (text: string): MessagePart[] => {
    if (!text) return [{ type: 'text', content: '' }];

    const emojiUrlRegex = /(🗺️|🧭|📍|📧|✉️)\s*(https?:\/\/[^\s)]+|mailto:[^\s)]+)/gu;
    const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g;
    const plainUrlRegex = /(https?:\/\/[^\s)]+|mailto:[^\s)]+)/g;

    const spans: { start: number; end: number; part: MessagePart }[] = [];

    collectMatches(text, emojiUrlRegex, (m) => {
        const emoji = m[1];
        const url = sanitizeUrl(m[2]);
        spans.push({
            start: m.index,
            end: m.index + m[0].length,
            part: { type: 'link', content: inferLabelFromUrl(url) || url, url, icon: emoji }
        });
    });

    collectMatches(text, markdownRegex, (m) => {
        const label = m[1].trim();
        const url = sanitizeUrl(m[2]);
        spans.push({ start: m.index, end: m.index + m[0].length, part: { type: 'link', content: label, url } });
    });

    collectMatches(text, plainUrlRegex, (m) => {
        const url = sanitizeUrl(m[1] || m[0]);
        if (spans.some(s => m.index >= s.start && m.index < s.end)) return;
        spans.push({ start: m.index, end: m.index + m[0].length, part: { type: 'link', content: inferLabelFromUrl(url) || url, url } });
    });

    spans.sort((a, b) => a.start - b.start);

    const parts: MessagePart[] = [];
    let cursor = 0;
    for (const s of spans) {
        if (cursor < s.start) {
            parts.push({ type: 'text', content: text.substring(cursor, s.start) });
        }
        parts.push(s.part);
        cursor = s.end;
    }
    if (cursor < text.length) parts.push({ type: 'text', content: text.substring(cursor) });

    return parts.length ? mergeAdjacentText(parts) : [{ type: 'text', content: text }];
};

function collectMatches(text: string, regex: RegExp, handler: (m: RegExpExecArray) => void) {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) handler(m);
}

function sanitizeUrl(url: string): string {
    return url.replace(/[)\],!?:;]*$/, '').trim();
}

function inferLabelFromUrl(url: string): string {
    if (isMapsUrl(url)) return 'Google Maps';
    if (isUsosUrl(url) && url.includes('email')) return 'USOS Email';
    if (isUsosUrl(url)) return 'USOS';
    if (isEmailUrl(url)) return 'E-mail';
    return '';
}

function mergeAdjacentText(parts: MessagePart[]): MessagePart[] {
    const merged: MessagePart[] = [];
    for (const p of parts) {
        const last = merged[merged.length - 1];
        if (last && last.type === 'text' && p.type === 'text') {
            last.content += p.content;
        } else {
            merged.push(p);
        }
    }
    return merged;
}

export const isMapsUrl = (url: string): boolean => {
    return url.includes('maps.google') ||
        url.includes('google.com/maps') ||
        url.includes('openstreetmap') ||
        url.includes('maps');
};

export const isUsosUrl = (url: string): boolean => {
    return url.includes('usos') || url.includes('usosoweb') || url.includes('/usos/');
};

export const isEmailUrl = (url: string): boolean => {
    return url.startsWith('mailto:');
};

export const openUrl = async (url: string): Promise<void> => {
    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            console.warn('Cannot open URL:', url);
        }
    } catch (error) {
        console.error('Error opening URL:', error);
    }
};
