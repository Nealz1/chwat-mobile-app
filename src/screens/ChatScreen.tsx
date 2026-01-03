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
    Keyboard,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import * as Haptics from 'expo-haptics';
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
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';
import { useGroupAutocomplete } from '../hooks/useGroupAutocomplete';

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
    const [attachedFile, setAttachedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const [explainModalVisible, setExplainModalVisible] = useState(false);
    const [explainText, setExplainText] = useState('');
    const abortControllerRef = useRef<AbortController | null>(null);

    // Use group autocomplete hook
    const {
        groupSuggestions,
        showGroupAutocomplete,
        handleInputChange: handleGroupInputChange,
        insertGroupSuggestion,
    } = useGroupAutocomplete();

    // Keyboard listeners for Android (keyboardHeight state already declared above)

    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        loadUser();
        loadDraft();
    }, []);

    const loadDraft = async () => {
        try {
            const draft = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT_MESSAGE || 'draft_message');
            if (draft) setInputText(draft);
        } catch (error) {
            console.error('Error loading draft:', error);
        }
    };

    // Save draft when input changes
    useEffect(() => {
        const saveDraft = async () => {
            try {
                if (inputText) {
                    await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_MESSAGE || 'draft_message', inputText);
                } else {
                    await AsyncStorage.removeItem(STORAGE_KEYS.DRAFT_MESSAGE || 'draft_message');
                }
            } catch (error) {
                console.error('Error saving draft:', error);
            }
        };
        const timeoutId = setTimeout(saveDraft, 500);
        return () => clearTimeout(timeoutId);
    }, [inputText]);

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
                    <Text style={[styles.menuButtonText, { color: isDark ? '#ffffff' : '#1a1a1a' }]}>☰</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, isDark]);

    const loadUser = async () => {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
    };

    const loadSessionMessages = async (sessionId: number) => {
        try {
            // Use conversation tree to get sibling info for version navigation
            const tree = await chatService.getConversationTree(sessionId);
            if (tree && tree.length > 0) {
                const converted: Message[] = tree.map((node: any) => ({
                    sender: node.role === 'user' ? 'user' : 'bot',
                    text: node.content,
                    nodeId: node.id,
                    parentId: node.parent_id,
                    siblingCount: node.sibling_count,
                    currentIndex: node.current_index,
                    feedback: node.feedback,
                }));
                setMessages(converted);
            } else {
                // Fallback to regular messages if tree is empty
                const msgs = await chatService.getSessionMessages(sessionId);
                const converted: Message[] = msgs.map(m => ({
                    sender: m.role === 'user' ? 'user' : 'bot',
                    text: m.content,
                    nodeId: m.node_id,
                }));
                setMessages(converted.length > 0 ? converted : [
                    { sender: 'bot', text: t.chat.welcomeMessage }
                ]);
            }
        } catch (error) {
            console.error('Error loading session messages:', error);
        }
    };

    const handleSend = useCallback(async () => {
        if (!inputText.trim() || isLoading) return;

        // Haptic feedback on send
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
            abortControllerRef.current = null;
        }
    }, [inputText, isLoading, user, currentSessionId, t]);

    const handleCancel = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
        // Remove the loading message
        setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.isLoading) {
                return prev.slice(0, -1);
            }
            return prev;
        });
    }, []);

    const handleNewChat = useCallback(() => {
        setCurrentSessionId(undefined);
        setMessages([
            { sender: 'bot', text: t.chat.welcomeMessage }
        ]);
    }, [t]);

    const handleCopyMessage = useCallback(async (text: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

    // Handle version navigation (switch between message siblings)
    const handleNavigateVersion = useCallback(async (index: number, direction: 'prev' | 'next') => {
        if (!currentSessionId) return;

        const message = messages[index];
        if (!message || !message.nodeId || !message.siblingCount || message.siblingCount <= 1) return;

        try {
            setIsLoading(true);
            const siblings = await chatService.getMessageSiblings(message.nodeId);
            if (siblings.length <= 1) return;

            const currentIdx = siblings.findIndex((s: any) => s.id === message.nodeId);
            if (currentIdx === -1) return;

            let newIdx = currentIdx;
            if (direction === 'prev' && currentIdx > 0) {
                newIdx = currentIdx - 1;
            } else if (direction === 'next' && currentIdx < siblings.length - 1) {
                newIdx = currentIdx + 1;
            } else {
                setIsLoading(false);
                return;
            }

            const newSibling = siblings[newIdx];
            const parentId = message.parentId ?? 0;

            await chatService.setActiveVersion(currentSessionId, parentId, newSibling.id);
            await loadSessionMessages(currentSessionId);
        } catch (error) {
            console.error('Error navigating version:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentSessionId, messages]);

    // Handle file attachment
    const handleAttachFile = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setAttachedFile(file);
                Alert.alert(
                    language === 'pl' ? 'Plik załączony' : 'File attached',
                    file.name
                );
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert(
                language === 'pl' ? 'Błąd' : 'Error',
                language === 'pl' ? 'Nie udało się wybrać pliku' : 'Failed to pick file'
            );
        }
    }, [language]);

    // Handle voice recording
    const handleVoiceRecord = useCallback(async () => {
        if (isRecording) {
            // Stop recording
            try {
                audioRecorder.stop();
                setIsRecording(false);

                // Get the recorded URI
                const uri = audioRecorder.uri;

                // For now, just show that recording was captured
                Alert.alert(
                    language === 'pl' ? 'Nagranie zakończone' : 'Recording complete',
                    language === 'pl' ? 'Funkcja transkrypcji wkrótce dostępna' : 'Transcription feature coming soon'
                );
            } catch (error) {
                console.error('Error stopping recording:', error);
            }
        } else {
            // Start recording
            try {
                const status = await AudioModule.requestRecordingPermissionsAsync();
                if (!status.granted) {
                    Alert.alert(
                        language === 'pl' ? 'Brak dostępu' : 'Permission denied',
                        language === 'pl' ? 'Wymagany dostęp do mikrofonu' : 'Microphone access required'
                    );
                    return;
                }

                audioRecorder.record();
                setIsRecording(true);
            } catch (error) {
                console.error('Error starting recording:', error);
                Alert.alert(
                    language === 'pl' ? 'Błąd' : 'Error',
                    language === 'pl' ? 'Nie udało się rozpocząć nagrywania' : 'Failed to start recording'
                );
            }
        }
    }, [isRecording, language, audioRecorder]);

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

    // Handle input change with group autocomplete (using hook)
    const handleInputChange = useCallback((text: string) => {
        handleGroupInputChange(text, setInputText);
    }, [handleGroupInputChange]);

    // Handle inserting group suggestion
    const handleInsertGroupSuggestion = useCallback((suggestion: string) => {
        insertGroupSuggestion(suggestion, inputText, setInputText);
    }, [insertGroupSuggestion, inputText]);

    // Explain Decision - find the user query that triggered this bot response
    const handleExplain = useCallback((botMsgIndex: number) => {
        // Find the preceding user message
        for (let i = botMsgIndex - 1; i >= 0; i--) {
            if (messages[i].sender === 'user') {
                setExplainText(messages[i].text);
                setExplainModalVisible(true);
                return;
            }
        }
        // No user message found
        setExplainText(language === 'pl' ? 'Brak poprzedniego zapytania użytkownika' : 'No previous user query found');
        setExplainModalVisible(true);
    }, [messages, language]);

    const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
        // Welcome message (first message when no chat history) - centered, no bubble
        const isWelcomeMessage = index === 0 && messages.length === 1 && item.sender === 'bot';

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
                                onPress={() => handleCopyMessage(item.text)}
                            >
                                <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                            {item.sender === 'user' && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleStartEdit(index, item.text)}
                                    disabled={isLoading}
                                >
                                    <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                            {item.sender === 'bot' && index > 0 && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleRegenerateResponse(index)}
                                    disabled={isLoading}
                                >
                                    <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                            {item.sender === 'bot' && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleSpeak(item.text)}
                                >
                                    <Ionicons name="volume-high-outline" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                            {item.sender === 'bot' && index > 0 && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleExplain(index)}
                                >
                                    <Ionicons name="help-circle-outline" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                            {item.sender === 'bot' && item.nodeId && user && (
                                <>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleFeedback(item.nodeId!, 'positive')}
                                    >
                                        <Ionicons name="thumbs-up-outline" size={16} color={item.feedback === 'positive' ? colors.primary : colors.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleFeedback(item.nodeId!, 'negative')}
                                    >
                                        <Ionicons name="thumbs-down-outline" size={16} color={item.feedback === 'negative' ? '#FF4444' : colors.textSecondary} />
                                    </TouchableOpacity>
                                </>
                            )}
                            {/* Version Navigator */}
                            {item.siblingCount && item.siblingCount > 1 && (
                                <View style={styles.versionNavigator}>
                                    <TouchableOpacity
                                        style={styles.versionButton}
                                        onPress={() => handleNavigateVersion(index, 'prev')}
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
                                        onPress={() => handleNavigateVersion(index, 'next')}
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
    }, [colors, isDark, handleCopyMessage, handleRegenerateResponse, handleStartEdit, handleFeedback, handleSpeak, handleNavigateVersion, isLoading, user, messages]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <BackgroundLogo />
            <SideMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                navigation={navigation}
            />
            <KeyboardAvoidingView
                style={styles.container}
                behavior="padding"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Messages List */}
                <FlatList
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(_, index) => index.toString()}
                    contentContainerStyle={[styles.messagesList, { paddingBottom: 80 + keyboardHeight }]}
                    inverted={false}
                    keyboardShouldPersistTaps="handled"
                />

                {/* Input Area - Positioned at bottom */}
                <View style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.surface,
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: keyboardHeight > 0 ? keyboardHeight + 50 : 20,
                    }
                ]}>
                    {/* Attached file indicator */}
                    {attachedFile && (
                        <View style={[styles.attachedFileRow, { backgroundColor: colors.background }]}>
                            <Text style={[styles.attachedFileName, { color: colors.text }]} numberOfLines={1}>
                                📎 {attachedFile.name}
                            </Text>
                            <TouchableOpacity onPress={() => setAttachedFile(null)}>
                                <Text style={[styles.removeAttachment, { color: colors.error }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.inputRow}>
                        {/* Attach file button */}
                        <TouchableOpacity
                            style={styles.inputActionButton}
                            onPress={handleAttachFile}
                            disabled={isLoading}
                        >
                            <Text style={[styles.inputActionIcon, { color: colors.textSecondary }]}>+</Text>
                        </TouchableOpacity>

                        <View style={styles.inputWithAutocomplete}>
                            {/* Group autocomplete dropdown */}
                            {showGroupAutocomplete && groupSuggestions.length > 0 && (
                                <View style={[styles.autocompleteDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    {groupSuggestions.map((suggestion, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.autocompleteItem, { borderBottomColor: colors.border }]}
                                            onPress={() => handleInsertGroupSuggestion(suggestion)}
                                        >
                                            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                                            <Text style={[styles.autocompleteText, { color: colors.text }]}>{suggestion}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <TextInput
                                style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                value={inputText}
                                onChangeText={handleInputChange}
                                placeholder={t.chat.placeholder}
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                maxLength={4000}
                                editable={!isLoading}
                            />
                        </View>

                        {/* Voice record button */}
                        <TouchableOpacity
                            style={styles.inputActionButton}
                            onPress={handleVoiceRecord}
                            disabled={isLoading}
                        >
                            <Ionicons
                                name={isRecording ? "stop-circle" : "mic-outline"}
                                size={24}
                                color={isRecording ? colors.error : colors.textSecondary}
                            />
                        </TouchableOpacity>

                        {/* Send/Cancel button */}
                        {isLoading ? (
                            <TouchableOpacity
                                style={[styles.sendButton, { backgroundColor: colors.error }]}
                                onPress={handleCancel}
                            >
                                <Ionicons name="stop" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    { backgroundColor: inputText.trim() ? colors.primary : colors.border }
                                ]}
                                onPress={handleSend}
                                disabled={!inputText.trim()}
                            >
                                <Ionicons name="send" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>
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

            {/* Explain Decision Modal */}
            <Modal
                visible={explainModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setExplainModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {language === 'pl' ? 'Wyjaśnienie decyzji' : 'Decision Explanation'}
                        </Text>
                        <Text style={[styles.explainLabel, { color: colors.textSecondary }]}>
                            {language === 'pl' ? 'Odpowiedź na zapytanie:' : 'Response to query:'}
                        </Text>
                        <Text style={[styles.explainText, { color: colors.text, backgroundColor: colors.background }]}>
                            {explainText}
                        </Text>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.primary, marginTop: 16 }]}
                            onPress={() => setExplainModalVisible(false)}
                        >
                            <Text style={{ color: '#FFFFFF' }}>{language === 'pl' ? 'Zamknij' : 'Close'}</Text>
                        </TouchableOpacity>
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
    inputContainer: {
        flexDirection: 'column',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    attachedFileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    attachedFileName: {
        flex: 1,
        fontSize: 14,
    },
    removeAttachment: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingLeft: 12,
    },
    inputActionButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputActionIcon: {
        fontSize: 22,
        fontWeight: 'bold',
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
        justifyContent: 'flex-start',
        marginTop: 12,
        paddingTop: 8,
        gap: 4,
        flexWrap: 'wrap',
        alignItems: 'center',
        width: '100%',
    },
    actionButton: {
        padding: 6,
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
    explainLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    explainText: {
        fontSize: 16,
        padding: 12,
        borderRadius: 8,
        lineHeight: 22,
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
    inputWithAutocomplete: {
        flex: 1,
        position: 'relative',
    },
    autocompleteDropdown: {
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        marginBottom: 4,
        borderRadius: 8,
        borderWidth: 1,
        maxHeight: 200,
        zIndex: 100,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    autocompleteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        gap: 8,
    },
    autocompleteText: {
        fontSize: 14,
    },
});
