import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import type { Message, User } from '../types';
import { ThinkingSteps } from './ThinkingSteps';
import { Suggestions } from './Suggestions';

function isInAppUrl(url: string): boolean {
    return url.includes('usos.wat.edu.pl') || url.includes('usosapps.wat.edu.pl');
}

async function openUrl(url: string): Promise<void> {
    if (isInAppUrl(url)) {
        await WebBrowser.openBrowserAsync(url, {
            dismissButtonStyle: 'close',
            showTitle: true,
            enableBarCollapsing: true,
        });
    } else {
        await Linking.openURL(url);
    }
}

function renderMarkdownText(text: string, textColor: string, primaryColor: string): React.ReactNode[] {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
            elements.push(<Text key={`br-${lineIndex}`}>{'\n'}</Text>);
        }

        const parts = parseInlineMarkdown(line, textColor, primaryColor, lineIndex);
        elements.push(...parts);
    });

    return elements;
}

function parseInlineMarkdown(text: string, textColor: string, primaryColor: string, lineKey: number): React.ReactNode[] {
    const elements: React.ReactNode[] = [];
    const combinedRegex = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    let partIndex = 0;

    while ((match = combinedRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            elements.push(
                <Text key={`${lineKey}-text-${partIndex++}`}>
                    {text.slice(lastIndex, match.index)}
                </Text>
            );
        }

        if (match[1] && match[2]) {
            const linkText = match[1];
            const url = match[2];
            elements.push(
                <Text
                    key={`${lineKey}-link-${partIndex++}`}
                    style={{ color: primaryColor, textDecorationLine: 'underline' }}
                    onPress={() => openUrl(url)}
                >
                    {linkText}
                </Text>
            );
        } else if (match[3]) {
            elements.push(
                <Text key={`${lineKey}-bold-${partIndex++}`} style={{ fontWeight: 'bold' }}>
                    {match[3]}
                </Text>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        elements.push(
            <Text key={`${lineKey}-text-${partIndex++}`}>
                {text.slice(lastIndex)}
            </Text>
        );
    }

    if (elements.length === 0) {
        elements.push(<Text key={`${lineKey}-text-0`}>{text}</Text>);
    }

    return elements;
}

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
            {item.sender === 'bot' && (
                <ThinkingSteps
                    data={item.thinking_steps}
                    isLoading={item.isLoading}
                    currentStep={item.thinkingStep}
                    colors={colors}
                    isDark={isDark}
                />
            )}



            {/* Content Section - With Markdown */}
            {item.text ? (
                <Text style={{
                    color: colors.text,
                    fontSize: 16,
                    lineHeight: 24,
                }}>
                    {renderMarkdownText(item.text, colors.text, colors.primary)}
                </Text>
            ) : null}

            {item.sender === 'bot' && item.suggestions && onSuggestionPress && (
                <Suggestions
                    data={item.suggestions}
                    onSuggestionPress={onSuggestionPress}
                />
            )}

            {/* Actions Footer - Only visible when accessible */}
            {!item.isLoading && (
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

                    {item.sender === 'bot' && (
                        <>
                            {index > 0 && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => onRegenerate(index)}
                                    disabled={isLoading}
                                >
                                    <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => onSpeak(item.text)}
                            >
                                <Ionicons name="volume-high-outline" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {index > 0 && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => onExplain(index)}
                                >
                                    <Ionicons name="help-circle-outline" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}

                            {item.nodeId && user && (
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
        padding: 14,
        paddingBottom: 16,
        borderRadius: 20,
        maxWidth: '90%',
        minHeight: 'auto',
    },
    userMessage: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    botMessage: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    actionButton: {
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    versionNavigator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        gap: 2,
    },
    versionButton: {
        padding: 4,
    },
    versionText: {
        fontSize: 12,
        minWidth: 24,
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
