import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Animated,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import type { Message, User } from '../types';
import { ThinkingSteps } from './ThinkingSteps';
import { Suggestions } from './Suggestions';

interface MessageItemProps {
    item: Message;
    index: number;
    messagesLength: number;
    colors: {
        text: string;
        textSecondary: string;
        primary: string;
        border: string;
    };
    isDark: boolean;
    isLoading: boolean;
    user: User | null;
    onCopy: (text: string) => void;
    onEdit: (index: number, text: string) => void;
    onRegenerate: (index: number) => void;
    onSpeak: (text: string) => void;
    onExplain: (index: number) => void;
    onFeedback: (nodeId: number, type: 'positive' | 'negative') => void;
    onNavigateVersion: (index: number, direction: 'prev' | 'next') => void;
    onSuggestionPress?: (query: string) => void;
}

export function MessageItem({
    item,
    index,
    messagesLength,
    colors,
    isDark,
    isLoading,
    user,
    onCopy,
    onEdit,
    onRegenerate,
    onSpeak,
    onExplain,
    onFeedback,
    onNavigateVersion,
    onSuggestionPress,
}: MessageItemProps) {
    const isWelcomeMessage = index === 0 && messagesLength === 1 && item.sender === 'bot';

    if (isWelcomeMessage) {
        return (
            <View style={styles.welcomeMessageContainer}>
                <Text style={[styles.welcomeMessageText, { color: colors.text }]}>
                    {item.text}
                </Text>
            </View>
        );
    }

    return (
        <View style={[
            styles.messageContainer,
            item.sender === 'user' ? styles.userMessage : styles.botMessage,
            { backgroundColor: item.sender === 'user' ? (isDark ? '#3A3A3A' : '#E5E5E5') : 'transparent' }
        ]}>
            {item.isLoading ? (
                <View style={styles.typingContainer}>
                    <ActivityIndicator color={colors.textSecondary} size="small" />
                    <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                        Typing...
                    </Text>
                </View>
            ) : (
                <>
                    <Markdown style={{
                        body: {
                            color: colors.text,
                            fontSize: 16,
                        },
                        code_inline: {
                            backgroundColor: isDark ? '#2D2D2D' : '#F0F0F0',
                            borderRadius: 4,
                            paddingHorizontal: 4,
                        },
                        code_block: {
                            backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
                            borderRadius: 8,
                            padding: 12,
                        },
                    }}>
                        {item.text}
                    </Markdown>

                    {item.sender === 'bot' && item.thinking_steps && (
                        <ThinkingSteps data={item.thinking_steps} />
                    )}
                    {item.sender === 'bot' && item.suggestions && onSuggestionPress && (
                        <Suggestions
                            data={item.suggestions}
                            onSuggestionPress={onSuggestionPress}
                        />
                    )}
                    <View style={styles.messageActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => onCopy(item.text)}
                        >
                            <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        {item.sender === 'user' && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => onEdit(index, item.text)}
                                disabled={isLoading}
                            >
                                <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                        {item.sender === 'bot' && index > 0 && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => onRegenerate(index)}
                                disabled={isLoading}
                            >
                                <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                        {item.sender === 'bot' && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => onSpeak(item.text)}
                            >
                                <Ionicons name="volume-high-outline" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                        {item.sender === 'bot' && index > 0 && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => onExplain(index)}
                            >
                                <Ionicons name="help-circle-outline" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                        {item.sender === 'bot' && item.nodeId && user && (
                            <>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => onFeedback(item.nodeId!, 'positive')}
                                >
                                    <Ionicons name="thumbs-up-outline" size={16} color={item.feedback === 'positive' ? colors.primary : colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => onFeedback(item.nodeId!, 'negative')}
                                >
                                    <Ionicons name="thumbs-down-outline" size={16} color={item.feedback === 'negative' ? '#FF4444' : colors.textSecondary} />
                                </TouchableOpacity>
                            </>
                        )}

                        {item.siblingCount && item.siblingCount > 1 && (
                            <View style={styles.versionNavigator}>
                                <TouchableOpacity
                                    style={styles.versionButton}
                                    onPress={() => onNavigateVersion(index, 'prev')}
                                    disabled={(item.currentIndex ?? 1) <= 1}
                                >
                                    <Ionicons
                                        name="chevron-back"
                                        size={14}
                                        color={(item.currentIndex ?? 1) <= 1 ? colors.border : colors.textSecondary}
                                    />
                                </TouchableOpacity>
                                <Text style={[styles.versionText, { color: colors.textSecondary }]}>
                                    {item.currentIndex ?? 1}/{item.siblingCount}
                                </Text>
                                <TouchableOpacity
                                    style={styles.versionButton}
                                    onPress={() => onNavigateVersion(index, 'next')}
                                    disabled={(item.currentIndex ?? 1) >= (item.siblingCount ?? 1)}
                                >
                                    <Ionicons
                                        name="chevron-forward"
                                        size={14}
                                        color={(item.currentIndex ?? 1) >= (item.siblingCount ?? 1) ? colors.border : colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    welcomeMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 100,
    },
    welcomeMessageText: {
        fontSize: 22,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 32,
    },
    messageContainer: {
        marginHorizontal: 16,
        marginVertical: 4,
        padding: 12,
        borderRadius: 16,
        maxWidth: '85%',
    },
    userMessage: {
        alignSelf: 'flex-end',
    },
    botMessage: {
        alignSelf: 'flex-start',
    },
    messageActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(128, 128, 128, 0.2)',
        gap: 8,
    },
    actionButton: {
        padding: 8,
        minWidth: 32,
        minHeight: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    versionNavigator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        gap: 2,
    },
    versionButton: {
        padding: 4,
    },
    versionText: {
        fontSize: 12,
        minWidth: 30,
        textAlign: 'center',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    typingText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
});
