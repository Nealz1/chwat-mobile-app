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
    Modal,
    Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';
import { groupsService, Group } from '../services/groupsService';
import type { ChatSession, User } from '../types';
import { useTheme } from '../contexts/ThemeContext';
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

    // Rename modal state
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [sessionToRename, setSessionToRename] = useState<ChatSession | null>(null);
    const [newTitle, setNewTitle] = useState('');

    // Add to group modal state
    const [groupModalVisible, setGroupModalVisible] = useState(false);
    const [sessionForGroup, setSessionForGroup] = useState<ChatSession | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);

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
            await loadGroups();
        }
    };

    const loadSessions = async () => {
        try {
            const data = await chatService.getSessions(true);
            setAllSessions(data);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    };

    const loadGroups = async () => {
        try {
            const data = await groupsService.getGroups();
            setGroups(data);
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    };

    const filterSessions = () => {
        let filtered = allSessions;

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

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s => s.title.toLowerCase().includes(query));
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
        const renameText = language === 'pl' ? 'Zmień nazwę' : 'Rename';
        const addToGroupText = language === 'pl' ? 'Dodaj do grupy' : 'Add to group';

        const options = [
            { text: t.common.cancel, style: 'cancel' as const },
            {
                text: renameText,
                onPress: () => {
                    setSessionToRename(session);
                    setNewTitle(session.title);
                    setRenameModalVisible(true);
                },
            },
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
                text: addToGroupText,
                onPress: () => {
                    setSessionForGroup(session);
                    setGroupModalVisible(true);
                },
            },
            {
                text: t.common.delete,
                style: 'destructive' as const,
                onPress: () => confirmDelete(session),
            },
        ];

        Alert.alert(
            session.title,
            language === 'pl' ? 'Wybierz akcję' : 'Choose action',
            options
        );
    };

    const handleRename = async () => {
        if (sessionToRename && newTitle.trim()) {
            await chatService.updateSessionTitle(sessionToRename.id, newTitle.trim());
            setRenameModalVisible(false);
            setSessionToRename(null);
            setNewTitle('');
            await loadSessions();
        }
    };

    const handleAddToGroup = async (groupId: number) => {
        if (sessionForGroup) {
            await groupsService.addSessionToGroup(sessionForGroup.id, groupId);
            setGroupModalVisible(false);
            setSessionForGroup(null);
            Alert.alert(
                '✅',
                language === 'pl' ? 'Dodano do grupy' : 'Added to group'
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

            {/* Rename Modal */}
            <Modal
                visible={renameModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setRenameModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {language === 'pl' ? 'Zmień nazwę' : 'Rename'}
                        </Text>
                        <TextInput
                            style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background }]}
                            value={newTitle}
                            onChangeText={setNewTitle}
                            placeholder={language === 'pl' ? 'Nowa nazwa...' : 'New name...'}
                            placeholderTextColor={colors.textSecondary}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.border }]}
                                onPress={() => {
                                    setRenameModalVisible(false);
                                    setSessionToRename(null);
                                }}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                                    {t.common.cancel}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={handleRename}
                            >
                                <Text style={styles.modalButtonText}>{t.common.confirm}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add to Group Modal */}
            <Modal
                visible={groupModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setGroupModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {language === 'pl' ? 'Wybierz grupę' : 'Select group'}
                        </Text>
                        {groups.length === 0 ? (
                            <Text style={[styles.noGroupsText, { color: colors.textSecondary }]}>
                                {language === 'pl' ? 'Brak grup' : 'No groups'}
                            </Text>
                        ) : (
                            groups.map(group => (
                                <TouchableOpacity
                                    key={group.id}
                                    style={[styles.groupOption, { backgroundColor: colors.background }]}
                                    onPress={() => handleAddToGroup(group.id)}
                                >
                                    <Text style={[styles.groupOptionText, { color: colors.text }]}>
                                        📁 {group.name}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        )}
                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: colors.border }]}
                            onPress={() => {
                                setGroupModalVisible(false);
                                setSessionForGroup(null);
                            }}
                        >
                            <Text style={[styles.modalButtonText, { color: colors.text }]}>
                                {t.common.cancel}
                            </Text>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalInput: {
        padding: 14,
        borderRadius: 10,
        fontSize: 16,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    noGroupsText: {
        textAlign: 'center',
        marginBottom: 16,
    },
    groupOption: {
        padding: 14,
        borderRadius: 10,
        marginBottom: 8,
    },
    groupOptionText: {
        fontSize: 16,
    },
    cancelButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
});
