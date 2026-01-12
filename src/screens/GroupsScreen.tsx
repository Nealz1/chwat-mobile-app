import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,

    Alert,
    TextInput,
    RefreshControl,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { groupsService, Group } from '../services/groupsService';
import { authService } from '../services/authService';
import type { User, ChatSession } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Groups'>;

export function GroupsScreen({ navigation }: Props) {
    const { colors } = useTheme();
    const { language } = useLanguage();
    const [groups, setGroups] = useState<Group[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupSessions, setGroupSessions] = useState<ChatSession[]>([]);

    const t = {
        title: language === 'pl' ? 'Grupy' : 'Groups',
        createGroup: language === 'pl' ? 'Utwórz grupę' : 'Create group',
        groupName: language === 'pl' ? 'Nazwa grupy' : 'Group name',
        noGroups: language === 'pl' ? 'Brak grup' : 'No groups yet',
        delete: language === 'pl' ? 'Usuń' : 'Delete',
        cancel: language === 'pl' ? 'Anuluj' : 'Cancel',
        confirm: language === 'pl' ? 'Potwierdź' : 'Confirm',
        deleteConfirm: language === 'pl' ? 'Usunąć grupę?' : 'Delete group?',
        sessions: language === 'pl' ? 'rozmów' : 'chats',
        back: language === 'pl' ? 'Wróć' : 'Back',
        loginRequired: language === 'pl' ? 'Zaloguj się, aby zobaczyć grupy' : 'Log in to see groups',
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
            await loadGroups();
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

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadGroups();
        setRefreshing(false);
    }, []);

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;

        const group = await groupsService.createGroup(newGroupName.trim());
        if (group) {
            setNewGroupName('');
            setShowCreateModal(false);
            await loadGroups();
        }
    };

    const handleDeleteGroup = (group: Group) => {
        Alert.alert(
            t.deleteConfirm,
            `"${group.name}"`,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.delete,
                    style: 'destructive',
                    onPress: async () => {
                        await groupsService.deleteGroup(group.id);
                        await loadGroups();
                    },
                },
            ]
        );
    };

    const handleSelectGroup = async (group: Group) => {
        setSelectedGroup(group);
        const sessions = await groupsService.getGroupSessions(group.id);
        setGroupSessions(sessions);
    };

    const handleSelectSession = (session: ChatSession) => {
        navigation.navigate('Chat', { sessionId: session.id });
    };

    const renderGroup = ({ item }: { item: Group }) => (
        <TouchableOpacity
            style={[styles.groupItem, { backgroundColor: colors.surface }]}
            onPress={() => handleSelectGroup(item)}
            onLongPress={() => handleDeleteGroup(item)}
        >
            <View style={styles.groupIcon}>
                <Ionicons name="folder" size={24} color="#007AFF" />
            </View>
            <View style={styles.groupContent}>
                <Text style={[styles.groupName, { color: colors.text }]}>
                    {item.name}
                </Text>
                <Text style={[styles.groupCount, { color: colors.textSecondary }]}>
                    {item.session_count || 0} {t.sessions}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderSession = ({ item }: { item: ChatSession }) => (
        <TouchableOpacity
            style={[styles.sessionItem, { backgroundColor: colors.surface }]}
            onPress={() => handleSelectSession(item)}
        >
            <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
            </Text>
        </TouchableOpacity>
    );

    if (!user) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {t.loginRequired}
                    </Text>
                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginButtonText}>
                            {language === 'pl' ? 'Zaloguj się' : 'Log in'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (selectedGroup) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.groupHeader}>
                    <TouchableOpacity onPress={() => setSelectedGroup(null)}>
                        <Text style={[styles.backButton, { color: colors.primary }]}>
                            ← {t.back}
                        </Text>
                    </TouchableOpacity>
                    <Text style={[styles.groupTitle, { color: colors.text }]}>
                        {selectedGroup.name}
                    </Text>
                </View>
                {groupSessions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {language === 'pl' ? 'Brak rozmów w grupie' : 'No chats in group'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={groupSessions}
                        renderItem={renderSession}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.list}
                    />
                )}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            
            <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowCreateModal(true)}
            >
                <Text style={styles.createButtonText}>+ {t.createGroup}</Text>
            </TouchableOpacity>

            
            {groups.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {t.noGroups}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={groups}
                    renderItem={renderGroup}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}

            
            <Modal
                visible={showCreateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {t.createGroup}
                        </Text>
                        <TextInput
                            style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background }]}
                            placeholder={t.groupName}
                            placeholderTextColor={colors.textSecondary}
                            value={newGroupName}
                            onChangeText={setNewGroupName}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.border }]}
                                onPress={() => {
                                    setNewGroupName('');
                                    setShowCreateModal(false);
                                }}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                                    {t.cancel}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={handleCreateGroup}
                            >
                                <Text style={styles.modalButtonText}>{t.confirm}</Text>
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
    createButton: {
        margin: 12,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    list: {
        paddingHorizontal: 12,
        paddingBottom: 16,
    },
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    groupIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,122,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupIconText: {
        fontSize: 20,
    },
    groupContent: {
        marginLeft: 12,
        flex: 1,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    groupCount: {
        fontSize: 13,
    },
    groupHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    backButton: {
        fontSize: 16,
        marginBottom: 8,
    },
    groupTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    sessionItem: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    sessionTitle: {
        fontSize: 16,
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
});
