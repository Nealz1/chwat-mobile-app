
import { useState, useCallback } from 'react';
import { chatService } from '../services/chatService';

export interface Message {
    sender: 'user' | 'bot';
    text: string;
    nodeId?: number;
    parentId?: number | null;
    siblingCount?: number;
    currentIndex?: number;
    feedback?: 'positive' | 'negative' | null;
    isLoading?: boolean;
}

interface MessageNode {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    parent_id: number | null;
    sibling_count?: number;
    current_index?: number;
    feedback?: 'positive' | 'negative' | null;
}

export const useMessageTree = (sessionId: number | null) => {
    const [treeVersion, setTreeVersion] = useState(0);

    const convertTreeToMessages = (tree: MessageNode[]): Message[] => {
        return tree.map(node => ({
            sender: node.role === 'user' ? 'user' : 'bot',
            text: node.content,
            nodeId: node.id,
            parentId: node.parent_id,
            siblingCount: node.sibling_count,
            currentIndex: node.current_index,
            feedback: node.feedback
        })) as Message[];
    };

    const loadConversationTree = useCallback(async (): Promise<Message[]> => {
        if (!sessionId) return [];

        try {
            const tree = await chatService.getConversationTree(sessionId);
            return convertTreeToMessages(tree);
        } catch (error) {
            console.error('Error loading conversation tree:', error);
            return [];
        }
    }, [sessionId]);

    const regenerateMessage = useCallback(async (
        index: number,
        messages: Message[]
    ): Promise<Message[] | null> => {
        if (!sessionId) return null;

        const message = messages[index];
        if (!message || message.sender !== 'bot') return null;

        const parentMessage = index > 0 ? messages[index - 1] : null;
        if (!parentMessage || !parentMessage.nodeId) return null;

        try {
            const result = await chatService.regenerateResponse(sessionId, parentMessage.nodeId);
            if (!result) return null;

            const updatedTree = await chatService.getConversationTree(sessionId);
            setTreeVersion(v => v + 1);
            return convertTreeToMessages(updatedTree);
        } catch (error) {
            console.error('Error regenerating message:', error);
            return null;
        }
    }, [sessionId]);

    const editMessage = useCallback(async (
        index: number,
        newContent: string,
        messages: Message[]
    ): Promise<Message[] | null> => {
        if (!sessionId) return null;

        const message = messages[index];
        if (!message || message.sender !== 'user' || !message.nodeId) return null;

        try {
            const result = await chatService.editMessage(sessionId, message.nodeId, newContent);
            if (!result) return null;

            const updatedTree = await chatService.getConversationTree(sessionId);
            setTreeVersion(v => v + 1);
            return convertTreeToMessages(updatedTree);
        } catch (error) {
            console.error('Error editing message:', error);
            return null;
        }
    }, [sessionId]);

    const navigateVersion = useCallback(async (
        index: number,
        direction: 'prev' | 'next',
        messages: Message[]
    ): Promise<Message[] | null> => {
        if (!sessionId) return null;

        const message = messages[index];
        if (!message || !message.nodeId || !message.siblingCount || message.siblingCount <= 1) {
            return null;
        }

        try {
            const siblings = await chatService.getMessageSiblings(message.nodeId);
            if (siblings.length <= 1) return null;

            const currentIdx = siblings.findIndex((s: any) => s.id === message.nodeId);
            if (currentIdx === -1) return null;

            let newIdx = currentIdx;
            if (direction === 'prev' && currentIdx > 0) {
                newIdx = currentIdx - 1;
            } else if (direction === 'next' && currentIdx < siblings.length - 1) {
                newIdx = currentIdx + 1;
            } else {
                return null; // Can't navigate further
            }

            const newSibling = siblings[newIdx];
            const parentId = message.parentId ?? 0;

            await chatService.setActiveVersion(sessionId, parentId, newSibling.id);

            const updatedTree = await chatService.getConversationTree(sessionId);
            setTreeVersion(v => v + 1);
            return convertTreeToMessages(updatedTree);
        } catch (error) {
            console.error('Error navigating version:', error);
            return null;
        }
    }, [sessionId]);

    return {
        loadConversationTree,
        regenerateMessage,
        editMessage,
        navigateVersion,
        treeVersion
    };
};
