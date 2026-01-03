import React, { memo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import type { Message, User } from '../types';
import { ThemeColors } from '../contexts/ThemeContext';

interface MessageItemProps {
    item: Message;
    index: number;
    isWelcomeMessage: boolean;
    isLoading: boolean;
    isDark: boolean;
    colors: ThemeColors;
    user: User | null;
    onCopy: (text: string) => void;
    onEdit: (index: number, text: string) => void;
    onRegenerate: (index: number) => void;
    onSpeak: (text: string) => void;
    onExplain: (index: number) => void;
    onFeedback: (nodeId: number, type: string) => void;
    onNavigateVersion: (index: number, direction: 'prev' | 'next') => void;
}

export const MessageItem = memo(({
    item,
    index,
    isWelcomeMessage,
    isLoading,
    isDark,
    colors,
    user,
    onCopy,
    onEdit,
    onRegenerate,
    onSpeak,
    onExplain,
    onFeedback,
    onNavigateVersion,
}: MessageItemProps) => {
    // Welcome message - centered, no bubble
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
                <ActivityIndicator color={colors.text} size="small" />
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

                    {/* Action buttons */}
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
                                    <Ionicons
                                        name="thumbs-up-outline"
                                        size={16}
                                        color={item.feedback === 'positive' ? colors.primary : colors.textSecondary}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => onFeedback(item.nodeId!, 'negative')}
                                >
                                    <Ionicons
                                        name="thumbs-down-outline"
                                        size={16}
                                        color={item.feedback === 'negative' ? '#FF4444' : colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Version Navigator */}
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
});

const styles = StyleSheet.create({
    welcomeMessageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    welcomeMessageText: {
        fontSize: 20,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 28,
    },
    messageContainer: {
        maxWidth: '85%',
        padding: 14,
        paddingHorizontal: 18,
        borderRadius: 20,
        marginBottom: 8,
    },
    userMessage: {
        alignSelf: 'flex-end',
    },
    botMessage: {
        alignSelf: 'flex-start',
    },
    messageActions: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 4,
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    actionButton: {
        padding: 6,
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
});

export default MessageItem;
