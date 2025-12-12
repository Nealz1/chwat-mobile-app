import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Markdown from 'react-native-markdown-display';
import { RootStackParamList } from '../navigation/AppNavigator';
import { chatService, SendMessageResponse } from '../services/chatService';
import { authService } from '../services/authService';
import type { Message, User } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { BackgroundLogo } from '../components/BackgroundLogo';
import { SideMenu } from '../components/SideMenu';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route, navigation }: Props) {
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();
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

    useEffect(() => {
        loadUser();
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

    const renderMessage = useCallback(({ item }: { item: Message }) => (
        <View style={[
            styles.messageContainer,
            item.sender === 'user' ? styles.userMessage : styles.botMessage,
            { backgroundColor: item.sender === 'user' ? colors.primary : colors.surfaceAlt }
        ]}>
            {item.isLoading ? (
                <ActivityIndicator color={colors.text} size="small" />
            ) : (
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
            )}
        </View>
    ), [colors, isDark]);

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
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                {/* Messages List */}
                <FlatList
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(_, index) => index.toString()}
                    contentContainerStyle={styles.messagesList}
                    inverted={false}
                />

                {/* Input Area */}
                <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
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
        paddingBottom: 32,
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
});
