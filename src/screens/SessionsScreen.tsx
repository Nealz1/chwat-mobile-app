import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    RefreshControl,
    TextInput,
    ActionSheetIOS,
    Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';
import type { ChatSession, User } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Sessions'>;
type TabType = 'active' | 'pinned' | 'archived';

export function SessionsScreen({ navigation }: Props) {
    const { colors } = useTheme();
    const { t, language } = useLanguage();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [allSessions, setAllSessions] = useState<ChatSession[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('active');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterSessions();
    }, [allSessions, activeTab, searchQuery]);

    const loadData = async () => {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
            await loadSessions();
        }
    };

    const loadSessions = async () => {
        try {
            const data = await chatService.getSessions(true); // Include archived
            setAllSessions(data);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    };

    const filterSessions = () => {
        let filtered = allSessions;

        // Filter by tab
        switch (activeTab) {
            case 'pinned':
                filtered = filtered.filter(s => s.is_pinned && !s.is_archived);
                break;
            case 'archived':
                filtered = filtered.filter(s => s.is_archived);
                break;
            case 'active':
            default:
                filtered = filtered.filter(s => !s.is_archived);
                break;
        }

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.title.toLowerCase().includes(query)
            );
        }

        setSessions(filtered);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadSessions();
        setRefreshing(false);
    }, []);

    const handleSelectSession = (session: ChatSession) => {
        navigation.navigate('Chat', { sessionId: session.id });
    };

    const showSessionOptions = (session: ChatSession) => {
        const options = [
            t.common.cancel,
            session.is_pinned ? t.common.unpin : t.common.pin,
            session.is_archived ? t.common.unarchive : t.common.archive,
            t.common.delete,
        ];

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: 0,
                    destructiveButtonIndex: 3,
                },
                async (buttonIndex) => {
                    if (buttonIndex === 1) {
                        await chatService.pinSession(session.id, !session.is_pinned);
                        await loadSessions();
                    } else if (buttonIndex === 2) {
                        if (session.is_archived) {
                            await chatService.unarchiveSession(session.id);
                        } else {
                            await chatService.archiveSession(session.id);
                        }
                        await loadSessions();
                    } else if (buttonIndex === 3) {
                        confirmDelete(session);
                    }
                }
            );
        } else {
            // Android fallback with Alert
            Alert.alert(
                session.title,
                language === 'pl' ? 'Wybierz akcję' : 'Choose action',
                [
                    { text: t.common.cancel, style: 'cancel' },
                    {
                        text: session.is_pinned ? t.common.unpin : t.common.pin,
                        onPress: async () => {
                            await chatService.pinSession(session.id, !session.is_pinned);
                            await loadSessions();
                        },
                    },
                    {
                        text: session.is_archived ? t.common.unarchive : t.common.archive,
                        onPress: async () => {
                            if (session.is_archived) {
                                await chatService.unarchiveSession(session.id);
                            } else {
                                await chatService.archiveSession(session.id);
                            }
                            await loadSessions();
                        },
                    },
                    {
                        text: t.common.delete,
                        style: 'destructive',
                        onPress: () => confirmDelete(session),
                    },
                ]
            );
        }
    };

    const confirmDelete = (session: ChatSession) => {
        Alert.alert(
            t.sessions.deleteConfirm,
            `"${session.title}"`,
            [
                { text: t.common.cancel, style: 'cancel' },
                {
                    text: t.common.delete,
                    style: 'destructive',
                    onPress: async () => {
                        await chatService.deleteSession(session.id);
                        await loadSessions();
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return t.sessions.today;
        if (diffDays === 1) return t.sessions.yesterday;
        if (diffDays < 7) return `${diffDays} ${t.sessions.daysAgo}`;
        return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US');
    };

    const renderSession = ({ item }: { item: ChatSession }) => (
        <TouchableOpacity
            style={[styles.sessionItem, { backgroundColor: colors.surface }]}
            onPress={() => handleSelectSession(item)}
            onLongPress={() => showSessionOptions(item)}
        >
            <View style={styles.sessionContent}>
                <View style={styles.sessionHeader}>
                    {item.is_pinned && <Text style={styles.pinIcon}>📌</Text>}
                    <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                    </Text>
                </View>
                <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                    {formatDate(item.updated_at)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderTab = (tab: TabType, label: string) => (
        <TouchableOpacity
            style={[
                styles.tab,
                activeTab === tab && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab(tab)}
        >
            <Text style={[
                styles.tabText,
                { color: activeTab === tab ? '#FFFFFF' : colors.text },
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    if (!user) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {language === 'pl' ? 'Zaloguj się, aby zobaczyć historię rozmów' : 'Log in to see chat history'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginButtonText}>{t.settings.login}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder={t.sessions.search}
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {renderTab('active', t.sessions.active)}
                {renderTab('pinned', t.sessions.pinned)}
                {renderTab('archived', t.sessions.archived)}
            </View>

            {/* Sessions List */}
            {sessions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {t.sessions.noSessions}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={sessions}
                    renderItem={renderSession}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        margin: 12,
        borderRadius: 10,
    },
    searchInput: {
        padding: 12,
        fontSize: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
    },
    list: {
        paddingHorizontal: 12,
        paddingBottom: 16,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    sessionContent: {
        flex: 1,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pinIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    sessionTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
        flex: 1,
    },
    sessionDate: {
        fontSize: 13,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    loginButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
