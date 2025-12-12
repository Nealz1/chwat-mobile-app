import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import {
    DrawerContentScrollView,
    DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { authService } from '../services/authService';
import { chatService } from '../services/chatService';
import type { User, ChatSession } from '../types';
import { useTheme } from '../hooks/useTheme';

export function CustomDrawer(props: DrawerContentComponentProps) {
    const { colors } = useTheme();
    const { navigation } = props;
    const [user, setUser] = useState<User | null>(null);
    const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
            const sessions = await chatService.getSessions();
            setRecentSessions(sessions.slice(0, 5));
        }
    };

    const handleNewChat = () => {
        navigation.navigate('Chat', { sessionId: undefined });
        navigation.closeDrawer();
    };

    const handleSelectSession = (sessionId: number) => {
        navigation.navigate('Chat', { sessionId });
        navigation.closeDrawer();
    };

    return (
        <DrawerContentScrollView
            {...props}
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={styles.container}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Text style={styles.headerTitle}>🎓 WAT Helpdesk</Text>
                <Text style={styles.headerSubtitle}>Asystent AI</Text>
            </View>

            {/* New Chat Button */}
            <TouchableOpacity
                style={[styles.newChatButton, { backgroundColor: colors.surface }]}
                onPress={handleNewChat}
            >
                <Text style={[styles.newChatText, { color: colors.primary }]}>+ Nowy czat</Text>
            </TouchableOpacity>

            {/* Recent Sessions */}
            {user && recentSessions.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        OSTATNIE ROZMOWY
                    </Text>
                    {recentSessions.map((session) => (
                        <TouchableOpacity
                            key={session.id}
                            style={[styles.sessionItem, { backgroundColor: colors.surface }]}
                            onPress={() => handleSelectSession(session.id)}
                        >
                            <Text
                                style={[styles.sessionTitle, { color: colors.text }]}
                                numberOfLines={1}
                            >
                                {session.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={styles.viewAllButton}
                        onPress={() => {
                            navigation.navigate('Sessions');
                            navigation.closeDrawer();
                        }}
                    >
                        <Text style={[styles.viewAllText, { color: colors.primary }]}>
                            Zobacz wszystkie →
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Navigation Items */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={[styles.navItem, { backgroundColor: colors.surface }]}
                    onPress={() => {
                        navigation.navigate('Settings');
                        navigation.closeDrawer();
                    }}
                >
                    <Text style={styles.navIcon}>⚙️</Text>
                    <Text style={[styles.navText, { color: colors.text }]}>Ustawienia</Text>
                </TouchableOpacity>

                {!user && (
                    <TouchableOpacity
                        style={[styles.navItem, { backgroundColor: colors.surface }]}
                        onPress={() => {
                            navigation.navigate('Login' as any);
                            navigation.closeDrawer();
                        }}
                    >
                        <Text style={styles.navIcon}>🔐</Text>
                        <Text style={[styles.navText, { color: colors.text }]}>Zaloguj się</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* User Info */}
            {user && (
                <View style={[styles.userSection, { backgroundColor: colors.surface }]}>
                    <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.userAvatarText}>
                            {user.first_name[0]}{user.last_name[0]}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.text }]}>
                            {user.first_name} {user.last_name}
                        </Text>
                        <Text style={[styles.userStatus, { color: colors.textSecondary }]}>
                            Zalogowano
                        </Text>
                    </View>
                </View>
            )}
        </DrawerContentScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 40,
        marginBottom: 8,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 4,
    },
    newChatButton: {
        margin: 12,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    newChatText: {
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    sessionItem: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 4,
    },
    sessionTitle: {
        fontSize: 15,
    },
    viewAllButton: {
        padding: 8,
        alignItems: 'center',
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '500',
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 10,
        marginBottom: 4,
    },
    navIcon: {
        fontSize: 18,
        marginRight: 12,
    },
    navText: {
        fontSize: 16,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 12,
        padding: 12,
        borderRadius: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatarText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    userInfo: {
        marginLeft: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
    },
    userStatus: {
        fontSize: 12,
    },
});
