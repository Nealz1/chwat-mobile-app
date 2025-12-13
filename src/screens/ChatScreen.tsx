import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
    Keyboard,
    Alert,
    Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Markdown from 'react-native-markdown-display';
import { RootStackParamList } from '../navigation/AppNavigator';
import { chatService, SendMessageResponse } from '../services/chatService';
import { authService } from '../services/authService';
import type { Message, User } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BackgroundLogo } from '../components/BackgroundLogo';
import { SideMenu } from '../components/SideMenu';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route, navigation }: Props) {
    const { colors, isDark } = useTheme();
    const { t, language } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: t.chat.welcomeMessage }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<number | undefined>(
        route.params?.sessionId
    );
    const [menuVisible, setMenuVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        loadUser();
    }, []);

    // Keyboard listener for Android
    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        if (route.params?.sessionId && route.params.sessionId !== currentSessionId) {
            setCurrentSessionId(route.params.sessionId);
            loadSessionMessages(route.params.sessionId);
        }
    }, [route.params?.sessionId]);

    // Set up header with hamburger menu
    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setMenuVisible(true)}
                >
                    <Text style={styles.menuButtonText}>☰</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const loadUser = async () => {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
    };

    const loadSessionMessages = async (sessionId: number) => {
        try {
            const msgs = await chatService.getSessionMessages(sessionId);
            const converted: Message[] = msgs.map(m => ({
                sender: m.role === 'user' ? 'user' : 'bot',
                text: m.content,
                nodeId: m.node_id,
            }));
            setMessages(converted.length > 0 ? converted : [
                { sender: 'bot', text: t.chat.welcomeMessage }
            ]);
        } catch (error) {
            console.error('Error loading session messages:', error);
        }
    };

    const handleSend = useCallback(async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: inputText.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        setMessages(prev => [...prev, { sender: 'bot', text: '', isLoading: true }]);

        try {
            let response: SendMessageResponse | { response: string };

            if (user) {
                response = await chatService.sendMessage(inputText.trim(), currentSessionId);
                if ('session_id' in response) {
                    setCurrentSessionId(response.session_id);
                }
            } else {
                response = await chatService.sendGuestMessage(inputText.trim());
            }

            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    sender: 'bot',
                    text: response.response,
                    nodeId: 'node_id' in response ? response.node_id : undefined,
                }
            ]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [
                ...prev.slice(0, -1),
                { sender: 'bot', text: t.chat.serverError }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [inputText, isLoading, user, currentSessionId, t]);

    const handleNewChat = useCallback(() => {
        setCurrentSessionId(undefined);
        setMessages([
            { sender: 'bot', text: t.chat.welcomeMessage }
        ]);
    }, [t]);

    const handleCopyMessage = useCallback(async (text: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('✓', t.chat?.copied || 'Skopiowano do schowka');
    }, [t]);

    const handleRegenerateResponse = useCallback(async (messageIndex: number) => {
        if (isLoading || messageIndex < 1) return;

        // Get the user message before this bot response
        const userMessage = messages[messageIndex - 1];
        if (userMessage?.sender !== 'user') return;

        setIsLoading(true);
        // Replace bot message with loading
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[messageIndex] = { sender: 'bot', text: '', isLoading: true };
            return newMessages;
        });

        try {
            let response: SendMessageResponse | { response: string };
            if (user) {
                response = await chatService.sendMessage(userMessage.text, currentSessionId);
            } else {
                response = await chatService.sendGuestMessage(userMessage.text);
            }

            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[messageIndex] = {
                    sender: 'bot',
                    text: response.response,
                    nodeId: 'node_id' in response ? response.node_id : undefined,
                };
                return newMessages;
            });
        } catch (error) {
            console.error('Error regenerating:', error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[messageIndex] = { sender: 'bot', text: t.chat.serverError };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, messages, user, currentSessionId, t]);

    const handleStartEdit = useCallback((index: number, text: string) => {
        setEditingIndex(index);
        setEditText(text);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingIndex(null);
        setEditText('');
    }, []);

    const handleSaveEdit = useCallback(async () => {
        if (editingIndex === null || !editText.trim() || isLoading) return;

        const editedUserMessage = editText.trim();
        handleCancelEdit();
        setIsLoading(true);

        // Update user message and replace following bot response with loading
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[editingIndex] = { sender: 'user', text: editedUserMessage };
            if (editingIndex + 1 < newMessages.length) {
                newMessages[editingIndex + 1] = { sender: 'bot', text: '', isLoading: true };
            }
            return newMessages;
        });

        try {
            let response: SendMessageResponse | { response: string };
            if (user) {
                response = await chatService.sendMessage(editedUserMessage, currentSessionId);
            } else {
                response = await chatService.sendGuestMessage(editedUserMessage);
            }

            setMessages(prev => {
                const newMessages = [...prev];
                if (editingIndex + 1 < newMessages.length) {
                    newMessages[editingIndex + 1] = {
                        sender: 'bot',
                        text: response.response,
                        nodeId: 'node_id' in response ? response.node_id : undefined,
                    };
                }
                return newMessages;
            });
        } catch (error) {
            console.error('Error after edit:', error);
            setMessages(prev => {
                const newMessages = [...prev];
                if (editingIndex + 1 < newMessages.length) {
                    newMessages[editingIndex + 1] = { sender: 'bot', text: t.chat.serverError };
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    }, [editingIndex, editText, isLoading, user, currentSessionId, t, handleCancelEdit]);

    const handleFeedback = useCallback(async (nodeId: number, feedbackType: string) => {
        if (!user) return;

        // Find the message with this nodeId and toggle feedback
        setMessages(prev => prev.map(msg => {
            if (msg.nodeId === nodeId) {
                const newFeedback = msg.feedback === feedbackType ? 'neutral' : feedbackType;
                // Submit to server
                authService.submitFeedback(nodeId, newFeedback);
                return { ...msg, feedback: newFeedback };
            }
            return msg;
        }));
    }, [user]);

    const handleSpeak = useCallback((text: string) => {
        // Remove markdown formatting for cleaner TTS
        const cleanText = text
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
            .replace(/\*(.*?)\*/g, '$1')      // Italic
            .replace(/`(.*?)`/g, '$1')        // Code
            .replace(/#{1,6}\s/g, '')         // Headers
            .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Links

        Speech.speak(cleanText, {
            language: language === 'pl' ? 'pl-PL' : 'en-US',
            rate: 0.9,
        });
    }, [language]);

    const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => (
        <View style={[
            styles.messageContainer,
            item.sender === 'user' ? styles.userMessage : styles.botMessage,
            { backgroundColor: item.sender === 'user' ? colors.primary : colors.surfaceAlt }
        ]}>
            {item.isLoading ? (
                <ActivityIndicator color={colors.text} size="small" />
            ) : (
                <>
                    <Markdown style={{
                        body: {
                            color: item.sender === 'user' ? '#FFFFFF' : colors.text,
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
                            onPress={() => handleCopyMessage(item.text)}
                        >
                            <Text style={[styles.actionIcon, { color: item.sender === 'user' ? '#FFFFFF99' : colors.textSecondary }]}>📋</Text>
                        </TouchableOpacity>
                        {item.sender === 'user' && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleStartEdit(index, item.text)}
                                disabled={isLoading}
                            >
                                <Text style={[styles.actionIcon, { color: '#FFFFFF99' }]}>✏️</Text>
                            </TouchableOpacity>
                        )}
                        {item.sender === 'bot' && index > 0 && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleRegenerateResponse(index)}
                                disabled={isLoading}
                            >
                                <Text style={[styles.actionIcon, { color: colors.textSecondary }]}>🔄</Text>
                            </TouchableOpacity>
                        )}
                        {item.sender === 'bot' && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleSpeak(item.text)}
                            >
                                <Text style={[styles.actionIcon, { color: colors.textSecondary }]}>🔊</Text>
                            </TouchableOpacity>
                        )}
                        {item.sender === 'bot' && item.nodeId && user && (
                            <>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleFeedback(item.nodeId!, 'positive')}
                                >
                                    <Text style={[styles.actionIcon, { color: item.feedback === 'positive' ? colors.primary : colors.textSecondary }]}>👍</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleFeedback(item.nodeId!, 'negative')}
                                >
                                    <Text style={[styles.actionIcon, { color: item.feedback === 'negative' ? '#FF4444' : colors.textSecondary }]}>👎</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </>
            )}
        </View>
    ), [colors, isDark, handleCopyMessage, handleRegenerateResponse, handleStartEdit, handleFeedback, handleSpeak, isLoading, user]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <BackgroundLogo />
            <SideMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                navigation={navigation}
            />
            <KeyboardAvoidingView
                style={styles.container}
                behavior="padding"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 120}
            >
                {/* Messages List */}
                <FlatList
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(_, index) => index.toString()}
                    contentContainerStyle={styles.messagesList}
                    inverted={false}
                    keyboardShouldPersistTaps="handled"
                />

                {/* Input Area */}
                <View style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.surface,
                        paddingBottom: keyboardHeight > 0 ? 12 : 48,
                    }
                ]}>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={t.chat.placeholder}
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        maxLength={4000}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            { backgroundColor: inputText.trim() ? colors.primary : colors.border }
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Text style={styles.sendButtonText}>➤</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Edit Message Modal */}
            <Modal
                visible={editingIndex !== null}
                transparent
                animationType="fade"
                onRequestClose={handleCancelEdit}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {language === 'pl' ? 'Edytuj wiadomość' : 'Edit message'}
                        </Text>
                        <TextInput
                            style={[styles.editInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                            value={editText}
                            onChangeText={setEditText}
                            multiline
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.border }]}
                                onPress={handleCancelEdit}
                            >
                                <Text style={{ color: colors.text }}>{language === 'pl' ? 'Anuluj' : 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={handleSaveEdit}
                                disabled={!editText.trim() || isLoading}
                            >
                                <Text style={{ color: '#FFFFFF' }}>{language === 'pl' ? 'Zapisz i wyślij' : 'Save & Send'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    menuButton: {
        padding: 8,
        marginLeft: 8,
    },
    menuButtonText: {
        fontSize: 24,
        color: '#FFFFFF',
    },
    messagesList: {
        padding: 16,
        paddingBottom: 8,
    },
    messageContainer: {
        maxWidth: '85%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    userMessage: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    botMessage: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        paddingBottom: 48,
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 120,
        fontSize: 16,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
    },
    newChatButton: {
        margin: 12,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    newChatText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    messageActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        gap: 8,
    },
    actionButton: {
        padding: 4,
    },
    actionIcon: {
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    editInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 16,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
});
