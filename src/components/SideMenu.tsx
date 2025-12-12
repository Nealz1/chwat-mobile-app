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
} from 'react-native';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';
import type { ChatSession, User } from '../types';
import { useTheme } from '../hooks/useTheme';
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
                            <Text style={styles.headerIcon}>🏛️</Text>
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
                                <Text style={styles.searchIcon}>🔍</Text>
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
                                <Text style={styles.buttonIcon}>📁</Text>
                                <Text style={[styles.outlinedButtonText, { color: colors.text }]}>
                                    {language === 'pl' ? 'Grupy' : 'Groups'}
                                </Text>
                            </TouchableOpacity>

                            {/* Section: GRUPY */}
                            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                GRUPY
                            </Text>
                            <TouchableOpacity style={styles.sessionItem} onPress={() => navigateTo('Groups')}>
                                <Text style={styles.sessionIcon}>📁</Text>
                                <Text style={[styles.sessionTitle, { color: colors.text }]}>g1</Text>
                                <Text style={styles.chevron}>›</Text>
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
                                            style={styles.sessionItem}
                                            onPress={() => handleOpenChat(session)}
                                        >
                                            <Text style={styles.sessionIcon}>💬</Text>
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
                                            style={styles.sessionItem}
                                            onPress={() => handleOpenChat(session)}
                                        >
                                            <Text style={styles.sessionIcon}>💬</Text>
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

                        {/* Bottom: User */}
                        <View style={[styles.bottomSection, { borderTopColor: borderColor }]}>
                            {user ? (
                                <TouchableOpacity
                                    style={styles.userSection}
                                    onPress={() => navigateTo('Settings')}
                                >
                                    <Text style={styles.userIcon}>👤</Text>
                                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                                        {user.first_name} {user.last_name}
                                    </Text>
                                    <Text style={styles.menuDots}>⋮</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.userSection}
                                    onPress={() => navigateTo('Login')}
                                >
                                    <Text style={styles.userIcon}>👤</Text>
                                    <Text style={[styles.userName, { color: colors.primary }]}>
                                        {language === 'pl' ? 'Zaloguj się' : 'Login'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Pressable>
                </Animated.View>
            </Pressable>
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
});
