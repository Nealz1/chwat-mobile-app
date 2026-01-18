import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    Modal,
    Animated,
    Pressable,
    ScrollView,
    Alert,
    Share,
    RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { chatService } from '../services/chatService';
import { groupsService } from '../services/groupsService';
import { authService } from '../services/authService';
import type { ChatSession, User } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { sideMenuStyles as styles, DRAWER_WIDTH } from '../styles/sideMenuStyles';

interface SideMenuProps {
    visible: boolean;
    onClose: () => void;
    navigation: any;
}

export function SideMenu({ visible, onClose, navigation }: SideMenuProps) {
    const { colors, isDark } = useTheme();
    const { language, t } = useLanguage();
    const [user, setUser] = useState<User | null>(null);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const [userMenuVisible, setUserMenuVisible] = useState(false);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [actionMenuVisible, setActionMenuVisible] = useState(false);
    const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
    const [groupPickerVisible, setGroupPickerVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (visible) {
            loadData();
            slideAnim.setValue(-DRAWER_WIDTH);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleClose = useCallback(() => {
        Animated.timing(slideAnim, {
            toValue: -DRAWER_WIDTH,
            duration: 200,
            useNativeDriver: true,
        }).start(() => onClose());
    }, [onClose, slideAnim]);

    const loadData = async () => {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
            await loadSessions();
            const groupsList = await groupsService.getGroups();
            setGroups(groupsList);
        }
    };

    const loadSessions = async () => {
        try {
            const data = await chatService.getSessions(false);
            setSessions(data.filter(s => !s.is_archived));
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const handleNewChat = () => {
        handleClose();
        navigation.navigate('Chat', { newChat: Date.now() });
    };

    const handleOpenChat = (session: ChatSession) => {
        handleClose();
        navigation.navigate('Chat', { sessionId: session.id });
    };

    const navigateTo = (screen: string) => {
        handleClose();
        navigation.navigate(screen);
    };

    const handleSessionLongPress = (session: ChatSession) => {
        setSelectedSession(session);
        setActionMenuVisible(true);
    };

    const handleRenameSession = () => {
        if (!selectedSession) return;
        setActionMenuVisible(false);

        Alert.prompt(
            language === 'pl' ? 'Zmień nazwę' : 'Rename',
            language === 'pl' ? 'Wprowadź nową nazwę' : 'Enter new title',
            async (newTitle) => {
                if (newTitle && newTitle.trim()) {
                    await chatService.updateSessionTitle(selectedSession.id, newTitle.trim());
                    setSessions(prev => prev.map(s =>
                        s.id === selectedSession.id ? { ...s, title: newTitle.trim() } : s
                    ));
                }
            },
            'plain-text',
            selectedSession.title
        );
    };

    const handlePinSession = async () => {
        if (!selectedSession) return;
        setActionMenuVisible(false);

        const newPinned = !selectedSession.is_pinned;
        const success = await chatService.pinSession(selectedSession.id, newPinned);
        if (success) {
            setSessions(prev => prev.map(s =>
                s.id === selectedSession.id ? { ...s, is_pinned: newPinned } : s
            ));
        }
    };

    const handleArchiveSession = async () => {
        if (!selectedSession) return;
        setActionMenuVisible(false);

        const success = await chatService.archiveSession(selectedSession.id);
        if (success) {
            setSessions(prev => prev.filter(s => s.id !== selectedSession.id));
        }
    };

    const handleDeleteSession = async () => {
        if (!selectedSession) return;

        Alert.alert(
            language === 'pl' ? 'Usuń rozmowę' : 'Delete chat',
            language === 'pl' ? 'Czy na pewno chcesz usunąć tę rozmowę?' : 'Are you sure you want to delete this chat?',
            [
                { text: language === 'pl' ? 'Anuluj' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'pl' ? 'Usuń' : 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setActionMenuVisible(false);
                        const success = await chatService.deleteSession(selectedSession.id);
                        if (success) {
                            setSessions(prev => prev.filter(s => s.id !== selectedSession.id));
                        }
                    }
                }
            ]
        );
    };

    const handleMoveToGroupOpen = () => {
        setActionMenuVisible(false);
        setGroupPickerVisible(true);
    };

    const handleSelectGroup = async (groupId: number | null) => {
        if (!selectedSession) return;
        setGroupPickerVisible(false);
        const success = await chatService.moveToGroup(selectedSession.id, groupId);
        if (success) {
            await loadSessions();
        }
    };

    const handleExportSession = async () => {
        if (!selectedSession) return;
        setActionMenuVisible(false);

        try {
            const messages = await chatService.getSessionMessages(selectedSession.id);

            let content = `# ${selectedSession.title}\n`;
            content += `${language === 'pl' ? 'Eksportowano' : 'Exported'}: ${new Date().toLocaleString()}\n\n`;

            messages.forEach((msg) => {
                const role = msg.role === 'user'
                    ? (language === 'pl' ? 'Użytkownik' : 'User')
                    : (language === 'pl' ? 'Asystent' : 'Assistant');
                content += `## ${role}\n${msg.content}\n\n`;
            });

            await Share.share({
                message: content,
                title: selectedSession.title,
            });
        } catch (error) {
            console.error('Error exporting session:', error);
            Alert.alert(
                language === 'pl' ? 'Błąd' : 'Error',
                language === 'pl' ? 'Nie udało się wyeksportować rozmowy' : 'Failed to export chat'
            );
        }
    };
    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const today = new Date();
    const todaySessions = filteredSessions.filter(s => {
        const d = new Date(s.updated_at);
        return d.toDateString() === today.toDateString();
    });
    const recentSessions = filteredSessions.filter(s => {
        const d = new Date(s.updated_at);
        return d.toDateString() !== today.toDateString();
    });

    if (!visible) return null;

    const borderColor = isDark ? '#3d3d3d' : '#e0e0e0';
    const bgColor = isDark ? colors.sidebar : '#ffffff';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
        >
            <Pressable style={styles.overlay} onPress={handleClose}>
                <Animated.View
                    style={[
                        styles.drawer,
                        { backgroundColor: bgColor, transform: [{ translateX: slideAnim }] }
                    ]}
                >
                    <Pressable style={styles.drawerContent}>

                        <View style={styles.header}>
                            <Text style={[styles.headerIcon, { color: colors.text }]}>⌂</Text>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>HELPDesk</Text>
                        </View>

                        <ScrollView
                            style={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    tintColor={colors.primary}
                                />
                            }
                        >

                            <TouchableOpacity
                                style={[styles.outlinedButton, { borderColor }]}
                                onPress={handleNewChat}
                            >
                                <Text style={[styles.outlinedButtonText, { color: colors.text }]}>
                                    + {language === 'pl' ? 'Nowa rozmowa' : 'New chat'}
                                </Text>
                            </TouchableOpacity>



                            <TouchableOpacity
                                style={[styles.searchContainer, { borderColor }]}
                                onPress={() => navigateTo('Search')}
                            >
                                <Ionicons name="search" size={18} color={colors.textSecondary} />
                                <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>
                                    {language === 'pl' ? 'Szukaj rozmów...' : 'Search chats...'}
                                </Text>
                            </TouchableOpacity>


                            <TouchableOpacity
                                style={[styles.outlinedButton, { borderColor }]}
                                onPress={() => navigateTo('Groups')}
                            >
                                <Ionicons name="folder-outline" size={18} color={colors.text} />
                                <Text style={[styles.outlinedButtonText, { color: colors.text }]}>
                                    {language === 'pl' ? 'Grupy' : 'Groups'}
                                </Text>
                            </TouchableOpacity>


                            {todaySessions.length > 0 && (
                                <>
                                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                        {language === 'pl' ? 'DZIŚ' : 'TODAY'}
                                    </Text>
                                    {todaySessions.map(session => (
                                        <TouchableOpacity
                                            key={session.id}
                                            style={[styles.sessionItem, session.is_pinned && styles.pinnedSession]}
                                            onPress={() => handleOpenChat(session)}
                                            onLongPress={() => handleSessionLongPress(session)}
                                        >
                                            <Text style={[styles.sessionIcon, { color: colors.text }]}>
                                                {session.is_pinned ? '📌' : '◇'}
                                            </Text>
                                            <Text
                                                style={[styles.sessionTitle, { color: colors.text }]}
                                                numberOfLines={1}
                                            >
                                                {session.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </>
                            )}


                            {recentSessions.length > 0 && (
                                <>
                                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                        {language === 'pl' ? 'OSTATNIE 30 DNI' : 'LAST 30 DAYS'}
                                    </Text>
                                    {recentSessions.map(session => (
                                        <TouchableOpacity
                                            key={session.id}
                                            style={[styles.sessionItem, session.is_pinned && styles.pinnedSession]}
                                            onPress={() => handleOpenChat(session)}
                                            onLongPress={() => handleSessionLongPress(session)}
                                        >
                                            <Text style={[styles.sessionIcon, { color: colors.text }]}>
                                                {session.is_pinned ? '📌' : '◇'}
                                            </Text>
                                            <Text
                                                style={[styles.sessionTitle, { color: colors.text }]}
                                                numberOfLines={1}
                                            >
                                                {session.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </>
                            )}
                        </ScrollView>


                        <View style={[styles.bottomSection, { borderTopColor: borderColor }]}>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigateTo('Settings')}
                            >
                                <Ionicons name="settings-outline" size={20} color={colors.text} style={styles.menuItemIcon} />
                                <Text style={[styles.menuItemText, { color: colors.text }]}>
                                    {language === 'pl' ? 'Ustawienia' : 'Settings'}
                                </Text>
                            </TouchableOpacity>


                            {user && (
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => navigateTo('Archives')}
                                >
                                    <Ionicons name="archive-outline" size={20} color={colors.text} style={styles.menuItemIcon} />
                                    <Text style={[styles.menuItemText, { color: colors.text }]}>
                                        {language === 'pl' ? 'Archiwum' : 'Archives'}
                                    </Text>
                                </TouchableOpacity>
                            )}


                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigateTo('Help')}
                            >
                                <Ionicons name="help-circle-outline" size={20} color={colors.text} style={styles.menuItemIcon} />
                                <Text style={[styles.menuItemText, { color: colors.text }]}>
                                    {language === 'pl' ? 'O aplikacji' : 'About'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigateTo('CanteenForm')}
                            >
                                <Ionicons name="restaurant-outline" size={20} color={colors.text} style={styles.menuItemIcon} />
                                <Text style={[styles.menuItemText, { color: colors.text }]}>
                                    {language === 'pl' ? 'Dodaj Menu' : 'Add Menu'}
                                </Text>
                            </TouchableOpacity>

                            {user ? (
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={async () => {
                                        await authService.logout();
                                        setUser(null);
                                        setSessions([]);
                                        setGroups([]);
                                        handleClose();
                                    }}
                                >
                                    <Ionicons name="log-out-outline" size={20} color={colors.text} style={styles.menuItemIcon} />
                                    <Text style={[styles.menuItemText, { color: colors.text }]}>
                                        {language === 'pl' ? 'Wyloguj' : 'Logout'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => navigateTo('Login')}
                                >
                                    <Ionicons name="log-in-outline" size={20} color={colors.text} style={styles.menuItemIcon} />
                                    <Text style={[styles.menuItemText, { color: colors.text }]}>
                                        {language === 'pl' ? 'Zaloguj się' : 'Login'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Pressable>
                </Animated.View>
            </Pressable>


            <Modal
                visible={actionMenuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setActionMenuVisible(false)}
            >
                <Pressable
                    style={styles.actionMenuOverlay}
                    onPress={() => setActionMenuVisible(false)}
                >
                    <View style={[styles.actionMenuContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.actionMenuTitle, { color: colors.text }]} numberOfLines={1}>
                            {selectedSession?.title}
                        </Text>


                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={handleRenameSession}
                        >
                            <Ionicons name="pencil-outline" size={18} color={colors.text} style={styles.actionMenuIcon} />
                            <Text style={[styles.actionMenuText, { color: colors.text }]}>
                                {language === 'pl' ? 'Zmień nazwę' : 'Rename'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={handlePinSession}
                        >
                            <Ionicons name={selectedSession?.is_pinned ? "pin" : "pin-outline"} size={18} color={colors.text} style={styles.actionMenuIcon} />
                            <Text style={[styles.actionMenuText, { color: colors.text }]}>
                                {selectedSession?.is_pinned
                                    ? (language === 'pl' ? 'Odepnij' : 'Unpin')
                                    : (language === 'pl' ? 'Przypnij' : 'Pin')
                                }
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={handleArchiveSession}
                        >
                            <Ionicons name="archive-outline" size={18} color={colors.text} style={styles.actionMenuIcon} />
                            <Text style={[styles.actionMenuText, { color: colors.text }]}>
                                {language === 'pl' ? 'Archiwizuj' : 'Archive'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={handleMoveToGroupOpen}
                        >
                            <Ionicons name="folder-outline" size={18} color={colors.text} style={styles.actionMenuIcon} />
                            <Text style={[styles.actionMenuText, { color: colors.text }]}>
                                {language === 'pl' ? 'Przenieś do grupy' : 'Move to group'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={handleExportSession}
                        >
                            <Ionicons name="share-outline" size={18} color={colors.text} style={styles.actionMenuIcon} />
                            <Text style={[styles.actionMenuText, { color: colors.text }]}>
                                {language === 'pl' ? 'Eksportuj' : 'Export'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={handleDeleteSession}
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.error} style={styles.actionMenuIcon} />
                            <Text style={[styles.actionMenuText, { color: colors.error }]}>
                                {language === 'pl' ? 'Usuń' : 'Delete'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>


            <Modal
                visible={groupPickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setGroupPickerVisible(false)}
            >
                <Pressable
                    style={styles.actionMenuOverlay}
                    onPress={() => setGroupPickerVisible(false)}
                >
                    <View style={[styles.actionMenuContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.actionMenuTitle, { color: colors.text }]}>
                            {language === 'pl' ? 'Wybierz grupę' : 'Select group'}
                        </Text>

                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={() => handleSelectGroup(null)}
                        >
                            <Text style={[styles.actionMenuIcon, { color: colors.textSecondary }]}>✕</Text>
                            <Text style={[styles.actionMenuText, { color: colors.textSecondary }]}>
                                {language === 'pl' ? 'Brak grupy' : 'No group'}
                            </Text>
                        </TouchableOpacity>

                        {groups.map(group => (
                            <TouchableOpacity
                                key={group.id}
                                style={styles.actionMenuItem}
                                onPress={() => handleSelectGroup(group.id)}
                            >
                                <Ionicons name="folder" size={18} color={colors.text} style={styles.actionMenuIcon} />
                                <Text style={[styles.actionMenuText, { color: colors.text }]}>
                                    {group.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </Modal>
    );
}
