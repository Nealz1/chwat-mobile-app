import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Modal,
    Animated,
    Dimensions,
    Pressable,
    ScrollView,
    Alert,
} from 'react-native';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';
import type { ChatSession, User } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.85;

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
    const [slideAnim] = useState(new Animated.Value(-DRAWER_WIDTH));
    const [userMenuVisible, setUserMenuVisible] = useState(false);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [actionMenuVisible, setActionMenuVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            loadData();
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -DRAWER_WIDTH,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const loadData = async () => {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
            await loadSessions();
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

    const handleNewChat = () => {
        onClose();
        navigation.navigate('Chat', {});
    };

    const handleOpenChat = (session: ChatSession) => {
        onClose();
        navigation.navigate('Chat', { sessionId: session.id });
    };

    const navigateTo = (screen: string) => {
        onClose();
        navigation.navigate(screen);
    };

    // Session action handlers
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

    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group sessions by date
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
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Animated.View
                    style={[
                        styles.drawer,
                        { backgroundColor: bgColor, transform: [{ translateX: slideAnim }] }
                    ]}
                >
                    <Pressable style={styles.drawerContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.headerIcon, { color: colors.text }]}>⌂</Text>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>HELPDesk</Text>
                        </View>

                        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            {/* New Chat Button */}
                            <TouchableOpacity
                                style={[styles.outlinedButton, { borderColor }]}
                                onPress={handleNewChat}
                            >
                                <Text style={[styles.outlinedButtonText, { color: colors.text }]}>
                                    + {language === 'pl' ? 'Nowa rozmowa' : 'New chat'}
                                </Text>
                            </TouchableOpacity>

                            {/* Search */}
                            <View style={[styles.searchContainer, { borderColor }]}>
                                <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>○</Text>
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder={language === 'pl' ? 'Szukaj rozmów' : 'Search chats'}
                                    placeholderTextColor={colors.textSecondary}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>

                            {/* Groups */}
                            <TouchableOpacity
                                style={[styles.outlinedButton, { borderColor }]}
                                onPress={() => navigateTo('Groups')}
                            >
                                <Text style={[styles.buttonIcon, { color: colors.text }]}>▤</Text>
                                <Text style={[styles.outlinedButtonText, { color: colors.text }]}>
                                    {language === 'pl' ? 'Grupy' : 'Groups'}
                                </Text>
                            </TouchableOpacity>

                            {/* Section: DZIŚ */}
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

                            {/* Section: OSTATNIE 30 DNI */}
                            {recentSessions.length > 0 && (
                                <>
                                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                        {language === 'pl' ? 'OSTATNIE 30 DNI' : 'LAST 30 DAYS'}
                                    </Text>
                                    {recentSessions.slice(0, 10).map(session => (
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

                        {/* Bottom: Menu items always visible like USOS */}
                        <View style={[styles.bottomSection, { borderTopColor: borderColor }]}>
                            {/* Settings */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigateTo('Settings')}
                            >
                                <Text style={[styles.menuItemIcon, { color: colors.text }]}>⚙</Text>
                                <Text style={[styles.menuItemText, { color: colors.text }]}>
                                    {language === 'pl' ? 'Ustawienia' : 'Settings'}
                                </Text>
                            </TouchableOpacity>

                            {/* Archives - only for logged in users */}
                            {user && (
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => navigateTo('Archives')}
                                >
                                    <Text style={[styles.menuItemIcon, { color: colors.text }]}>📦</Text>
                                    <Text style={[styles.menuItemText, { color: colors.text }]}>
                                        {language === 'pl' ? 'Archiwum' : 'Archives'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Help / About */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigateTo('Help')}
                            >
                                <Text style={[styles.menuItemIcon, { color: colors.text }]}>ⓘ</Text>
                                <Text style={[styles.menuItemText, { color: colors.text }]}>
                                    {language === 'pl' ? 'O aplikacji' : 'About'}
                                </Text>
                            </TouchableOpacity>

                            {/* Login/Logout */}
                            {user ? (
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={async () => {
                                        await authService.logout();
                                        setUser(null);
                                        onClose();
                                    }}
                                >
                                    <Text style={[styles.menuItemIcon, { color: colors.text }]}>⇥</Text>
                                    <Text style={[styles.menuItemText, { color: colors.text }]}>
                                        {language === 'pl' ? 'Wyloguj' : 'Logout'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => navigateTo('Login')}
                                >
                                    <Text style={[styles.menuItemIcon, { color: colors.text }]}>⇤</Text>
                                    <Text style={[styles.menuItemText, { color: colors.text }]}>
                                        {language === 'pl' ? 'Zaloguj się' : 'Login'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Pressable>
                </Animated.View>
            </Pressable>

            {/* Session Action Menu Modal */}
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

                        {/* Rename - using Alert.prompt which works on iOS, fallback for Android */}
                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={handleRenameSession}
                        >
                            <Text style={[styles.actionMenuIcon, { color: colors.text }]}>✎</Text>
                            <Text style={[styles.actionMenuText, { color: colors.text }]}>
                                {language === 'pl' ? 'Zmień nazwę' : 'Rename'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={handlePinSession}
                        >
                            <Text style={[styles.actionMenuIcon, { color: colors.text }]}>
                                {selectedSession?.is_pinned ? '📌' : '📍'}
                            </Text>
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
                            <Text style={[styles.actionMenuIcon, { color: colors.text }]}>📦</Text>
                            <Text style={[styles.actionMenuText, { color: colors.text }]}>
                                {language === 'pl' ? 'Archiwizuj' : 'Archive'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={handleDeleteSession}
                        >
                            <Text style={[styles.actionMenuIcon, { color: colors.error }]}>🗑</Text>
                            <Text style={[styles.actionMenuText, { color: colors.error }]}>
                                {language === 'pl' ? 'Usuń' : 'Delete'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    drawer: {
        width: DRAWER_WIDTH,
        height: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    drawerContent: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 48,
    },
    headerIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 12,
    },
    outlinedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 8,
    },
    buttonIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    outlinedButtonText: {
        fontSize: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 8,
    },
    searchIcon: {
        fontSize: 14,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 15,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    sessionIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    sessionTitle: {
        fontSize: 15,
        flex: 1,
    },
    chevron: {
        fontSize: 18,
        color: '#888',
    },
    bottomSection: {
        borderTopWidth: 1,
        padding: 12,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    userIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    userName: {
        fontSize: 15,
        flex: 1,
    },
    menuDots: {
        fontSize: 18,
        color: '#888',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    menuItemIcon: {
        fontSize: 16,
        marginRight: 10,
        color: '#888',
    },
    menuItemText: {
        fontSize: 14,
    },
    dropdownMenu: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
    },
    pinnedSession: {
        borderLeftWidth: 2,
        borderLeftColor: '#e67e22',
    },
    actionMenuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionMenuContent: {
        width: '80%',
        borderRadius: 12,
        padding: 16,
        maxWidth: 300,
    },
    actionMenuTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    actionMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    actionMenuIcon: {
        fontSize: 18,
        marginRight: 12,
        width: 24,
        textAlign: 'center',
    },
    actionMenuText: {
        fontSize: 16,
    },
});
