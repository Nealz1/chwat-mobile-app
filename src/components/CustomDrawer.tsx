import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    TextInput,
    RefreshControl,
} from 'react-native';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';
import type { ChatSession, User } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const watLogo = require('../../assets/wat_logo_light.png');

interface CustomDrawerProps {
    navigation: any;
}

export function CustomDrawer({ navigation }: CustomDrawerProps) {
    const { colors } = useTheme();
    const { language, t } = useLanguage();
    const [user, setUser] = useState<User | null>(null);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

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

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadSessions();
        setRefreshing(false);
    }, []);

    const handleNewChat = () => {
        navigation.navigate('Chat', {});
        navigation.closeDrawer();
    };

    const handleOpenChat = (session: ChatSession) => {
        navigation.navigate('Chat', { sessionId: session.id });
        navigation.closeDrawer();
    };

    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pinnedSessions = filteredSessions.filter(s => s.is_pinned);
    const regularSessions = filteredSessions.filter(s => !s.is_pinned);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            
            <View style={[styles.header, { backgroundColor: '#a51d22' }]}>
                <Image source={watLogo} style={styles.headerLogo} resizeMode="contain" />
                <Text style={styles.headerTitle}>HELPDesk</Text>
            </View>

            
            {user ? (
                <TouchableOpacity
                    style={[styles.userSection, { borderBottomColor: colors.border }]}
                    onPress={() => {
                        navigation.navigate('Settings');
                        navigation.closeDrawer();
                    }}
                >
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>
                            {user.first_name[0]}{user.last_name[0]}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.text }]}>
                            {user.first_name} {user.last_name}
                        </Text>
                        <Text style={[styles.userStatus, { color: colors.textSecondary }]}>
                            Student
                        </Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.loginSection, { borderBottomColor: colors.border }]}
                    onPress={() => {
                        navigation.navigate('Login');
                        navigation.closeDrawer();
                    }}
                >
                    <Text style={[styles.loginText, { color: colors.primary }]}>
                        {t.settings.login}
                    </Text>
                </TouchableOpacity>
            )}

            
            <TouchableOpacity
                style={[styles.newChatButton, { backgroundColor: colors.primary }]}
                onPress={handleNewChat}
            >
                <Text style={styles.newChatIcon}>+</Text>
                <Text style={styles.newChatText}>{t.chat?.newChat || 'Nowa rozmowa'}</Text>
            </TouchableOpacity>

            
            <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder={language === 'pl' ? 'Szukaj rozmów...' : 'Search chats...'}
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            
            <View style={styles.navSection}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => {
                        navigation.navigate('Groups');
                        navigation.closeDrawer();
                    }}
                >
                    <Text style={styles.navIcon}>📁</Text>
                    <Text style={[styles.navLabel, { color: colors.text }]}>
                        {language === 'pl' ? 'Grupy' : 'Groups'}
                    </Text>
                </TouchableOpacity>
            </View>

            
            <View style={styles.sessionsSection}>
                {pinnedSessions.length > 0 && (
                    <>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                            📌 {language === 'pl' ? 'Przypięte' : 'Pinned'}
                        </Text>
                        {pinnedSessions.map(session => (
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

                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    {language === 'pl' ? 'Ostatnie' : 'Recent'}
                </Text>
                <FlatList
                    data={regularSessions.slice(0, 10)}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.sessionItem}
                            onPress={() => handleOpenChat(item)}
                        >
                            <Text style={styles.sessionIcon}>💬</Text>
                            <Text
                                style={[styles.sessionTitle, { color: colors.text }]}
                                numberOfLines={1}
                            >
                                {item.title}
                            </Text>
                        </TouchableOpacity>
                    )}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {language === 'pl' ? 'Brak rozmów' : 'No chats'}
                        </Text>
                    }
                />
            </View>

            
            <View style={[styles.bottomSection, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => {
                        navigation.navigate('Sessions');
                        navigation.closeDrawer();
                    }}
                >
                    <Text style={styles.navIcon}>📋</Text>
                    <Text style={[styles.navLabel, { color: colors.text }]}>
                        {t.sessions?.title || 'Historia'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => {
                        navigation.navigate('Help');
                        navigation.closeDrawer();
                    }}
                >
                    <Text style={styles.navIcon}>❓</Text>
                    <Text style={[styles.navLabel, { color: colors.text }]}>
                        {language === 'pl' ? 'Pomoc' : 'Help'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => {
                        navigation.navigate('Settings');
                        navigation.closeDrawer();
                    }}
                >
                    <Text style={styles.navIcon}>⚙️</Text>
                    <Text style={[styles.navLabel, { color: colors.text }]}>
                        {t.settings?.title || 'Ustawienia'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 48,
    },
    headerLogo: {
        width: 32,
        height: 32,
        marginRight: 10,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    userInfo: {
        marginLeft: 12,
        flex: 1,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
    },
    userStatus: {
        fontSize: 13,
    },
    loginSection: {
        padding: 16,
        borderBottomWidth: 1,
    },
    loginText: {
        fontSize: 16,
        fontWeight: '500',
    },
    newChatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 12,
        padding: 12,
        borderRadius: 8,
    },
    newChatIcon: {
        color: '#FFFFFF',
        fontSize: 20,
        marginRight: 8,
        fontWeight: '600',
    },
    newChatText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    searchIcon: {
        fontSize: 14,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
    },
    navSection: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
    },
    navIcon: {
        fontSize: 16,
        marginRight: 12,
    },
    navLabel: {
        fontSize: 15,
    },
    sessionsSection: {
        flex: 1,
        paddingHorizontal: 8,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 12,
        paddingVertical: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 6,
        marginVertical: 1,
    },
    sessionIcon: {
        fontSize: 14,
        marginRight: 10,
    },
    sessionTitle: {
        fontSize: 14,
        flex: 1,
    },
    emptyText: {
        padding: 12,
        fontSize: 14,
        textAlign: 'center',
    },
    bottomSection: {
        borderTopWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
});
