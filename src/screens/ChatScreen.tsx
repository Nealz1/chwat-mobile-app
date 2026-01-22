import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Alert,
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { chatService, SendMessageResponse } from '../services/chatService';
import { streamChatResponse } from '../services/streamingService';
import { authService } from '../services/authService';
import type { Message, User, ThinkingStep } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BackgroundLogo } from '../components/BackgroundLogo';
import { SideMenu } from '../components/SideMenu';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, API_BASE_URL } from '../config/constants';
import { useGroupAutocomplete } from '../hooks/useGroupAutocomplete';
import { useMediaHandlers } from '../hooks/useMediaHandlers';
import { MessageItem } from '../components/MessageItem';
import { ChatInput } from '../components/ChatInput';
import { chatScreenStyles as styles } from '../styles/chatScreenStyles';

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
    const [explainModalVisible, setExplainModalVisible] = useState(false);
    const [explainText, setExplainText] = useState('');
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const abortControllerRef = useRef<AbortController | null>(null);

    const {
        groupSuggestions,
        showGroupAutocomplete,
        handleInputChange: handleGroupInputChange,
        insertGroupSuggestion,
    } = useGroupAutocomplete();

    const {
        attachedFile,
        setAttachedFile,
        isRecording,
        attachmentModalVisible,
        handleAttachFile,
        handleCameraPress,
        handleGalleryPress,
        handleFilesPress,
        handleVoiceRecord,
        removeAttachment,
        closeAttachmentModal,
    } = useMediaHandlers(setInputText);


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

    useFocusEffect(
        useCallback(() => {
            loadUser();
            if (currentSessionId) {
                loadSessionMessages(currentSessionId);
            }
        }, [currentSessionId])
    );

    const loadDraft = async () => {
        try {
            const draft = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT_MESSAGE || 'draft_message');
            if (draft) setInputText(draft);
        } catch (error) {
            console.error('Error loading draft:', error);
        }
    };

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

    useEffect(() => {
        const sessionId = route.params?.sessionId;
        if (sessionId) {
            setCurrentSessionId(sessionId);
            loadSessionMessages(sessionId);
        }
    }, [route.params?.sessionId]);

    useEffect(() => {
        if (route.params?.newChat && !route.params?.sessionId) {
            setCurrentSessionId(undefined);
            setMessages([{ sender: 'bot', text: t.chat.welcomeMessage }]);
            setInputText('');
            setAttachedFile(null);
        }
    }, [route.params?.newChat, route.params?.sessionId, t]);

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

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const messageText = inputText.trim();
        const currentAttachment = attachedFile;

        const userMessage: Message = { sender: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setAttachedFile(null);
        setIsLoading(true);
        setThinkingStep('');

        setMessages(prev => [...prev, {
            sender: 'bot',
            text: '',
            isLoading: true,
            thinkingStep: '',
            thinking_steps: { type: 'thinking_steps', steps: [], total_duration_ms: 0 }
        }]);

        abortControllerRef.current = new AbortController();

        try {
            if (currentAttachment && currentAttachment.mimeType?.startsWith('image/')) {
                const response = await chatService.sendMessageWithImage(
                    messageText,
                    currentAttachment.uri,
                    currentAttachment.mimeType || 'image/jpeg',
                    currentSessionId
                );

                if ('session_id' in response) {
                    setCurrentSessionId(response.session_id);
                }

                setMessages(prev => [
                    ...prev.slice(0, -1),
                    {
                        sender: 'bot',
                        text: response.response,
                        nodeId: 'node_id' in response ? response.node_id : undefined,
                        thinking_steps: {
                            type: 'thinking_steps',
                            steps: [{
                                type: 'step',
                                title: 'Analiza obrazu...',
                                detail: '',
                                duration_ms: 1000,
                                agent: null,
                                status: 'completed'
                            }],
                            total_duration_ms: 1000
                        }
                    }
                ]);
            } else {
                let streamedText = '';
                let steps: ThinkingStep[] = [];
                let stepStartTime = Date.now();
                let processStartTime = Date.now();

                const updateSteps = (currentSteps: ThinkingStep[], newTitle: string) => {
                    const now = Date.now();
                    if (currentSteps.length > 0) {
                        const lastStep = currentSteps[currentSteps.length - 1];

                        if (lastStep.title.trim().toLowerCase() === newTitle.trim().toLowerCase()) {
                            return currentSteps;
                        }

                        const localizedInitial = language === 'pl' ? 'Analizuję zapytanie...' : 'Analyzing query...';
                        if (lastStep.title === localizedInitial &&
                            (newTitle === 'thinking' || newTitle === 'Analizuję zapytanie...')) {
                            return currentSteps;
                        }

                        lastStep.duration_ms = now - stepStartTime;
                        lastStep.status = 'completed';
                    }

                    stepStartTime = now;
                    currentSteps.push({
                        type: 'step',
                        title: newTitle,
                        detail: '',
                        duration_ms: 0,
                        agent: null,
                        status: 'active'
                    });
                    return [...currentSteps];
                };

                await streamChatResponse({
                    message: messageText,
                    sessionId: currentSessionId,
                    useAgents: true,
                    abortController: abortControllerRef.current,
                    onStart: () => {
                        processStartTime = Date.now();
                        stepStartTime = Date.now();
                        steps = [{
                            type: 'initial',
                            title: language === 'pl' ? 'Analizuję zapytanie...' : 'Analyzing query...',
                            detail: '',
                            duration_ms: 0,
                            agent: null,
                            status: 'active'
                        }];
                        setMessages(prev => {
                            const updated = [...prev];
                            const lastIdx = updated.length - 1;
                            if (updated[lastIdx]?.isLoading) {
                                updated[lastIdx] = {
                                    ...updated[lastIdx],
                                    thinking_steps: {
                                        type: 'thinking_steps',
                                        steps: [...steps],
                                        total_duration_ms: 0
                                    }
                                };
                            }
                            return updated;
                        });
                    },
                    onStep: (step) => {
                        setThinkingStep(step);
                        steps = updateSteps(steps, step);
                        const totalDur = Date.now() - processStartTime;

                        setMessages(prev => {
                            const updated = [...prev];
                            const lastIdx = updated.length - 1;
                            if (updated[lastIdx]?.isLoading) {
                                updated[lastIdx] = {
                                    ...updated[lastIdx],
                                    thinkingStep: step,
                                    thinking_steps: {
                                        type: 'thinking_steps',
                                        steps: [...steps],
                                        total_duration_ms: totalDur
                                    }
                                };
                            }
                            return updated;
                        });
                    },
                    onToken: (token) => {
                        streamedText += token;
                        setMessages(prev => {
                            const updated = [...prev];
                            const lastIdx = updated.length - 1;
                            if (updated[lastIdx]) {
                                updated[lastIdx] = {
                                    ...updated[lastIdx],
                                    text: streamedText,
                                };
                            }
                            return updated;
                        });
                    },
                    onStatus: (status) => {
                        setThinkingStep(status);
                        steps = updateSteps(steps, status);
                        const totalDur = Date.now() - processStartTime;

                        setMessages(prev => {
                            const updated = [...prev];
                            const lastIdx = updated.length - 1;
                            if (updated[lastIdx]?.isLoading) {
                                updated[lastIdx] = {
                                    ...updated[lastIdx],
                                    thinkingStep: status,
                                    thinking_steps: {
                                        type: 'thinking_steps',
                                        steps: [...steps],
                                        total_duration_ms: totalDur
                                    }
                                };
                            }
                            return updated;
                        });
                    },
                    onDone: (fullResponse, sessionId, nodeId, siblingCount, currentIndex) => {
                        console.log(`[onDone] fullResponse length: ${fullResponse?.length || 0}`);
                        console.log(`[onDone] fullResponse preview: ${fullResponse?.substring(0, 200)}...`);
                        console.log(`[onDone] fullResponse end: ...${fullResponse?.substring(fullResponse.length - 200)}`);

                        const now = Date.now();
                        if (steps.length > 0) {
                            steps[steps.length - 1].duration_ms = now - stepStartTime;
                            steps[steps.length - 1].status = 'completed';
                        }
                        const totalDuration = now - processStartTime;

                        if (sessionId) {
                            setCurrentSessionId(sessionId);
                        }
                        setMessages(prev => [
                            ...prev.slice(0, -1),
                            {
                                sender: 'bot',
                                text: fullResponse,
                                nodeId: nodeId,
                                siblingCount: siblingCount,
                                currentIndex: currentIndex,
                                thinking_steps: {
                                    type: 'thinking_steps',
                                    steps: steps,
                                    total_duration_ms: totalDuration
                                }
                            }
                        ]);
                        setThinkingStep('');
                        setIsLoading(false);
                    },
                    onError: (error) => {
                        console.error('Streaming onError called:', error);
                        setMessages(prev => [
                            ...prev.slice(0, -1),
                            { sender: 'bot', text: t.chat.serverError }
                        ]);
                    },
                    onFileDownload: async (filename, _path) => {
                        try {
                            const downloadUrl = `${API_BASE_URL}/download/form/${encodeURIComponent(filename)}`;
                            const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                            const localUri = `${cacheDirectory}${filename}`;

                            console.log('Downloading file:', downloadUrl, 'to:', localUri);

                            const downloadResult = await downloadAsync(
                                downloadUrl,
                                localUri,
                                {
                                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                                }
                            );

                            console.log('Download result:', downloadResult.status, downloadResult.uri);

                            if (downloadResult.status === 200) {
                                await Sharing.shareAsync(downloadResult.uri, {
                                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                    dialogTitle: filename,
                                });
                            } else {
                                Alert.alert(
                                    language === 'pl' ? 'Błąd pobierania' : 'Download Error',
                                    `Status: ${downloadResult.status}`
                                );
                            }
                        } catch (err) {
                            console.error('File download error:', err);
                            Alert.alert(
                                language === 'pl' ? 'Błąd' : 'Error',
                                String(err)
                            );
                        }
                    },
                });
            }
        } catch (error) {
            console.error('OUTER CATCH - Error sending message:', error);
            setMessages(prev => [
                ...prev.slice(0, -1),
                { sender: 'bot', text: t.chat.serverError }
            ]);
        } finally {
            setIsLoading(false);
            setThinkingStep('');
            abortControllerRef.current = null;
        }
    }, [inputText, isLoading, currentSessionId, attachedFile, t, language]);

    const handleCancel = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
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

        const userMessage = messages[messageIndex - 1];
        if (userMessage?.sender !== 'user') return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsLoading(true);
        setThinkingStep('');

        const processStartTime = Date.now();
        let steps: ThinkingStep[] = [{
            type: 'initial',
            title: language === 'pl' ? 'Analizuję zapytanie...' : 'Analyzing query...',
            detail: '',
            duration_ms: 0,
            agent: null,
            status: 'active'
        }];

        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[messageIndex] = {
                sender: 'bot',
                text: '',
                isLoading: true,
                thinkingStep: steps[0].title,
                thinking_steps: { type: 'thinking_steps', steps: [...steps], total_duration_ms: 0 }
            };
            return newMessages;
        });

        try {
            if (userMessage.nodeId && currentSessionId) {
                steps[0].status = 'completed';
                steps[0].duration_ms = Date.now() - processStartTime;
                steps.push({
                    type: 'step',
                    title: language === 'pl' ? 'Generuję nową odpowiedź...' : 'Generating new response...',
                    detail: '',
                    duration_ms: 0,
                    agent: null,
                    status: 'active'
                });
                setMessages(prev => {
                    const newMessages = [...prev];
                    if (newMessages[messageIndex]?.isLoading) {
                        newMessages[messageIndex] = {
                            ...newMessages[messageIndex],
                            thinkingStep: steps[steps.length - 1].title,
                            thinking_steps: { type: 'thinking_steps', steps: [...steps], total_duration_ms: Date.now() - processStartTime }
                        };
                    }
                    return newMessages;
                });

                const result = await chatService.regenerateResponse(currentSessionId, userMessage.nodeId);

                if (result) {
                    const totalDuration = Date.now() - processStartTime;
                    steps[steps.length - 1].status = 'completed';
                    steps[steps.length - 1].duration_ms = totalDuration - steps[0].duration_ms;

                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[messageIndex] = {
                            sender: 'bot',
                            text: result.content,
                            nodeId: result.node_id,
                            siblingCount: result.sibling_count,
                            currentIndex: result.current_index,
                            thinking_steps: { type: 'thinking_steps', steps, total_duration_ms: totalDuration }
                        };
                        return newMessages;
                    });

                    if (result.file_download?.filename) {
                        try {
                            const downloadUrl = `${API_BASE_URL}/download/form/${encodeURIComponent(result.file_download.filename)}`;
                            const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                            const localUri = `${cacheDirectory}${result.file_download.filename}`;
                            await downloadAsync(downloadUrl, localUri, {
                                headers: token ? { Authorization: `Bearer ${token}` } : {}
                            });
                            await Sharing.shareAsync(localUri);
                        } catch (err) {
                            console.error('Error downloading file:', err);
                        }
                    }
                } else {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[messageIndex] = { sender: 'bot', text: t.chat.serverError };
                        return newMessages;
                    });
                    return;
                }
            } else {
                abortControllerRef.current = new AbortController();
                let streamedText = '';
                let stepStartTime = Date.now();

                const updateSteps = (currentSteps: ThinkingStep[], newTitle: string) => {
                    const now = Date.now();
                    if (currentSteps.length > 0) {
                        const lastStep = currentSteps[currentSteps.length - 1];
                        if (lastStep.title.trim().toLowerCase() === newTitle.trim().toLowerCase()) {
                            return currentSteps;
                        }
                        lastStep.duration_ms = now - stepStartTime;
                        lastStep.status = 'completed';
                    }
                    stepStartTime = now;
                    currentSteps.push({
                        type: 'step',
                        title: newTitle,
                        detail: '',
                        duration_ms: 0,
                        agent: null,
                        status: 'active'
                    });
                    return [...currentSteps];
                };

                await streamChatResponse({
                    message: userMessage.text,
                    sessionId: currentSessionId,
                    useAgents: true,
                    abortController: abortControllerRef.current,
                    onStep: (step) => {
                        setThinkingStep(step);
                        steps = updateSteps(steps, step);
                        setMessages(prev => {
                            const newMessages = [...prev];
                            if (newMessages[messageIndex]?.isLoading) {
                                newMessages[messageIndex] = {
                                    ...newMessages[messageIndex],
                                    thinkingStep: step,
                                    thinking_steps: { type: 'thinking_steps', steps: [...steps], total_duration_ms: Date.now() - processStartTime }
                                };
                            }
                            return newMessages;
                        });
                    },
                    onToken: (token) => {
                        streamedText += token;
                        setMessages(prev => {
                            const newMessages = [...prev];
                            if (newMessages[messageIndex]) {
                                newMessages[messageIndex] = { ...newMessages[messageIndex], text: streamedText };
                            }
                            return newMessages;
                        });
                    },
                    onDone: (fullResponse, sessionId, nodeId, siblingCount, currentIndex) => {
                        const totalDuration = Date.now() - processStartTime;
                        if (steps.length > 0) {
                            steps[steps.length - 1].duration_ms = Date.now() - stepStartTime;
                            steps[steps.length - 1].status = 'completed';
                        }
                        if (sessionId) setCurrentSessionId(sessionId);
                        setMessages(prev => {
                            const newMessages = [...prev];
                            newMessages[messageIndex] = {
                                sender: 'bot',
                                text: fullResponse,
                                nodeId,
                                siblingCount,
                                currentIndex,
                                thinking_steps: { type: 'thinking_steps', steps, total_duration_ms: totalDuration }
                            };
                            return newMessages;
                        });
                    },
                    onError: (error) => {
                        console.error('Regenerate streaming error:', error);
                        setMessages(prev => {
                            const newMessages = [...prev];
                            newMessages[messageIndex] = { sender: 'bot', text: t.chat.serverError };
                            return newMessages;
                        });
                    },
                });
            }
        } catch (error) {
            console.error('Error regenerating:', error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[messageIndex] = { sender: 'bot', text: t.chat.serverError };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
            setThinkingStep('');
            abortControllerRef.current = null;
        }
    }, [isLoading, messages, currentSessionId, t, language]);

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

        const originalUserMessage = messages[editingIndex];
        const editedUserMessage = editText.trim();
        const botMessageIndex = editingIndex + 1;
        handleCancelEdit();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsLoading(true);
        setThinkingStep('');

        const processStartTime = Date.now();
        let steps: ThinkingStep[] = [{
            type: 'initial',
            title: language === 'pl' ? 'Analizuję zapytanie...' : 'Analyzing query...',
            detail: '',
            duration_ms: 0,
            agent: null,
            status: 'active'
        }];

        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[editingIndex] = { sender: 'user', text: editedUserMessage };
            if (botMessageIndex < newMessages.length) {
                newMessages[botMessageIndex] = {
                    sender: 'bot',
                    text: '',
                    isLoading: true,
                    thinkingStep: steps[0].title,
                    thinking_steps: { type: 'thinking_steps', steps: [...steps], total_duration_ms: 0 }
                };
            }
            return newMessages;
        });

        try {
            if (originalUserMessage?.nodeId && currentSessionId) {
                steps[0].status = 'completed';
                steps[0].duration_ms = Date.now() - processStartTime;
                steps.push({
                    type: 'step',
                    title: language === 'pl' ? 'Przetwarzam edycję...' : 'Processing edit...',
                    detail: '',
                    duration_ms: 0,
                    agent: null,
                    status: 'active'
                });
                setMessages(prev => {
                    const newMessages = [...prev];
                    if (newMessages[botMessageIndex]?.isLoading) {
                        newMessages[botMessageIndex] = {
                            ...newMessages[botMessageIndex],
                            thinkingStep: steps[steps.length - 1].title,
                            thinking_steps: { type: 'thinking_steps', steps: [...steps], total_duration_ms: Date.now() - processStartTime }
                        };
                    }
                    return newMessages;
                });

                const result = await chatService.editMessage(currentSessionId, originalUserMessage.nodeId, editedUserMessage);

                if (result) {
                    const totalDuration = Date.now() - processStartTime;
                    steps[steps.length - 1].status = 'completed';
                    steps[steps.length - 1].duration_ms = totalDuration - steps[0].duration_ms;

                    await loadSessionMessages(currentSessionId);
                } else {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        if (botMessageIndex < newMessages.length) {
                            newMessages[botMessageIndex] = { sender: 'bot', text: t.chat.serverError };
                        }
                        return newMessages;
                    });
                }
            } else {
                abortControllerRef.current = new AbortController();
                let streamedText = '';
                let stepStartTime = Date.now();

                const updateSteps = (currentSteps: ThinkingStep[], newTitle: string) => {
                    const now = Date.now();
                    if (currentSteps.length > 0) {
                        const lastStep = currentSteps[currentSteps.length - 1];
                        if (lastStep.title.trim().toLowerCase() === newTitle.trim().toLowerCase()) {
                            return currentSteps;
                        }
                        lastStep.duration_ms = now - stepStartTime;
                        lastStep.status = 'completed';
                    }
                    stepStartTime = now;
                    currentSteps.push({
                        type: 'step',
                        title: newTitle,
                        detail: '',
                        duration_ms: 0,
                        agent: null,
                        status: 'active'
                    });
                    return [...currentSteps];
                };

                await streamChatResponse({
                    message: editedUserMessage,
                    sessionId: currentSessionId,
                    useAgents: true,
                    abortController: abortControllerRef.current,
                    onStep: (step) => {
                        setThinkingStep(step);
                        steps = updateSteps(steps, step);
                        setMessages(prev => {
                            const newMessages = [...prev];
                            if (newMessages[botMessageIndex]?.isLoading) {
                                newMessages[botMessageIndex] = {
                                    ...newMessages[botMessageIndex],
                                    thinkingStep: step,
                                    thinking_steps: { type: 'thinking_steps', steps: [...steps], total_duration_ms: Date.now() - processStartTime }
                                };
                            }
                            return newMessages;
                        });
                    },
                    onToken: (token) => {
                        streamedText += token;
                        setMessages(prev => {
                            const newMessages = [...prev];
                            if (newMessages[botMessageIndex]) {
                                newMessages[botMessageIndex] = { ...newMessages[botMessageIndex], text: streamedText };
                            }
                            return newMessages;
                        });
                    },
                    onDone: async (fullResponse, sessionId, nodeId, siblingCount, currentIndex) => {
                        const totalDuration = Date.now() - processStartTime;
                        if (steps.length > 0) {
                            steps[steps.length - 1].duration_ms = Date.now() - stepStartTime;
                            steps[steps.length - 1].status = 'completed';
                        }
                        if (sessionId) {
                            setCurrentSessionId(sessionId);
                            await loadSessionMessages(sessionId);
                        } else {
                            setMessages(prev => {
                                const newMessages = [...prev];
                                if (botMessageIndex < newMessages.length) {
                                    newMessages[botMessageIndex] = {
                                        sender: 'bot',
                                        text: fullResponse,
                                        nodeId,
                                        siblingCount,
                                        currentIndex,
                                        thinking_steps: { type: 'thinking_steps', steps, total_duration_ms: totalDuration }
                                    };
                                }
                                return newMessages;
                            });
                        }
                    },
                    onError: (error) => {
                        console.error('Edit streaming error:', error);
                        setMessages(prev => {
                            const newMessages = [...prev];
                            if (botMessageIndex < newMessages.length) {
                                newMessages[botMessageIndex] = { sender: 'bot', text: t.chat.serverError };
                            }
                            return newMessages;
                        });
                    },
                });
            }
        } catch (error) {
            console.error('Error after edit:', error);
            setMessages(prev => {
                const newMessages = [...prev];
                if (botMessageIndex < newMessages.length) {
                    newMessages[botMessageIndex] = { sender: 'bot', text: t.chat.serverError };
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
            setThinkingStep('');
            abortControllerRef.current = null;
        }
    }, [editingIndex, editText, isLoading, messages, currentSessionId, handleCancelEdit, t, language]);

    const handleFeedback = useCallback(async (nodeId: number, feedbackType: string) => {
        if (!user) return;

        setMessages(prev => prev.map(msg => {
            if (msg.nodeId === nodeId) {
                const newFeedback = msg.feedback === feedbackType ? 'neutral' : feedbackType;
                authService.submitFeedback(nodeId, newFeedback);
                return { ...msg, feedback: newFeedback };
            }
            return msg;
        }));
    }, [user]);

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

    const handleSpeak = useCallback((text: string) => {
        const cleanText = text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/#{1,6}\s/g, '')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1');

        Speech.speak(cleanText, {
            language: language === 'pl' ? 'pl-PL' : 'en-US',
            rate: 0.9,
        });
    }, [language]);

    const handleInputChange = useCallback((text: string) => {
        handleGroupInputChange(text, setInputText);
    }, [handleGroupInputChange]);

    const handleInsertGroupSuggestion = useCallback((suggestion: string) => {
        insertGroupSuggestion(suggestion, inputText, setInputText);
    }, [insertGroupSuggestion, inputText]);

    const handleExplain = useCallback(async (botMsgIndex: number) => {
        const botMessage = messages[botMsgIndex];
        if (!botMessage || botMessage.sender !== 'bot') return;

        setExplainText(language === 'pl' ? 'Ładowanie...' : 'Loading...');
        setExplainModalVisible(true);

        try {
            const result = await authService.explainMessage(botMessage.text);
            setExplainText(result.explanation || (language === 'pl' ? 'Brak wyjaśnienia' : 'No explanation available'));
        } catch (error) {
            console.error('Explain error:', error);
            setExplainText(language === 'pl' ? 'Nie udało się pobrać wyjaśnienia' : 'Failed to get explanation');
        }
    }, [messages, language]);

    const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
        return (
            <MessageItem
                item={item}
                index={index}
                messagesLength={messages.length}
                colors={colors}
                isDark={isDark}
                isLoading={isLoading}
                user={user}
                onCopy={handleCopyMessage}
                onEdit={handleStartEdit}
                onRegenerate={handleRegenerateResponse}
                onSpeak={handleSpeak}
                onExplain={handleExplain}
                onFeedback={handleFeedback}
                onNavigateVersion={handleNavigateVersion}
            />
        );
    }, [colors, isDark, handleCopyMessage, handleRegenerateResponse, handleStartEdit, handleFeedback, handleSpeak, handleNavigateVersion, handleExplain, isLoading, user, messages]);

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

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={[styles.messagesList, { paddingBottom: 250 + keyboardHeight }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                >
                    {messages.map((item, index) => (
                        <View key={index}>
                            {renderMessage({ item, index })}
                        </View>
                    ))}
                </ScrollView>


                <ChatInput
                    inputText={inputText}
                    onInputChange={handleInputChange}
                    onSend={handleSend}
                    onCancel={handleCancel}
                    onAttachFile={handleAttachFile}
                    onVoiceRecord={handleVoiceRecord}
                    isLoading={isLoading}
                    isRecording={isRecording}
                    attachedFile={attachedFile}
                    onRemoveAttachment={removeAttachment}
                    placeholder={t.chat.placeholder}
                    colors={colors}
                    keyboardHeight={keyboardHeight}
                    showGroupAutocomplete={showGroupAutocomplete}
                    groupSuggestions={groupSuggestions}
                    onInsertGroupSuggestion={handleInsertGroupSuggestion}
                />
            </KeyboardAvoidingView>


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


            <Modal
                visible={attachmentModalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeAttachmentModal}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={closeAttachmentModal}
                >
                    <View style={[styles.attachmentModal, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.attachmentTitle, { color: colors.text }]}>
                            {language === 'pl' ? 'Dodaj załącznik' : 'Add attachment'}
                        </Text>
                        <View style={styles.attachmentOptions}>
                            <TouchableOpacity
                                style={styles.attachmentOption}
                                onPress={handleCameraPress}
                            >
                                <View style={[styles.attachmentIconContainer, { backgroundColor: colors.primary + '20' }]}>
                                    <Ionicons name="camera-outline" size={28} color={colors.primary} />
                                </View>
                                <Text style={[styles.attachmentOptionText, { color: colors.text }]}>
                                    {language === 'pl' ? 'Aparat' : 'Camera'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.attachmentOption}
                                onPress={handleGalleryPress}
                            >
                                <View style={[styles.attachmentIconContainer, { backgroundColor: colors.primary + '20' }]}>
                                    <Ionicons name="images-outline" size={28} color={colors.primary} />
                                </View>
                                <Text style={[styles.attachmentOptionText, { color: colors.text }]}>
                                    {language === 'pl' ? 'Galeria' : 'Gallery'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.attachmentOption}
                                onPress={handleFilesPress}
                            >
                                <View style={[styles.attachmentIconContainer, { backgroundColor: colors.primary + '20' }]}>
                                    <Ionicons name="document-outline" size={28} color={colors.primary} />
                                </View>
                                <Text style={[styles.attachmentOptionText, { color: colors.text }]}>
                                    {language === 'pl' ? 'Pliki' : 'Files'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>


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
                            {language === 'pl' ? 'Wyjaśnienie:' : 'Explanation:'}
                        </Text>
                        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator>
                            <Text style={[styles.explainText, { color: colors.text, backgroundColor: colors.background }]}>
                                {explainText}
                            </Text>
                        </ScrollView>
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
