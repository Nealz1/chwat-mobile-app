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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';
import type { ChatSession, User } from '../types';
import { useTheme } from '../hooks/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'Sessions'>;

export function SessionsScreen({ navigation }: Props) {
    const { colors } = useTheme();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<User | null>(null);

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
            const data = await chatService.getSessions();
            setSessions(data);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadSessions();
        setRefreshing(false);
    }, []);

    const handleSelectSession = (session: ChatSession) => {
        navigation.navigate('Chat', { sessionId: session.id });
    };

    const handleDeleteSession = (session: ChatSession) => {
        Alert.alert(
            'Usuń rozmowę',
            `Czy na pewno chcesz usunąć "${session.title}"?`,
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Usuń',
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

        if (diffDays === 0) return 'Dzisiaj';
        if (diffDays === 1) return 'Wczoraj';
        if (diffDays < 7) return `${diffDays} dni temu`;
        return date.toLocaleDateString('pl-PL');
    };

    const renderSession = ({ item }: { item: ChatSession }) => (
        <TouchableOpacity
            style={[styles.sessionItem, { backgroundColor: colors.surface }]}
            onPress={() => handleSelectSession(item)}
            onLongPress={() => handleDeleteSession(item)}
        >
            <View style={styles.sessionContent}>
                <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                    {formatDate(item.updated_at)}
                </Text>
            </View>
            {item.is_pinned && (
                <Text style={styles.pinIcon}>📌</Text>
            )}
        </TouchableOpacity>
    );

    if (!user) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        Zaloguj się, aby zobaczyć historię rozmów
                    </Text>
                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginButtonText}>Zaloguj się</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {sessions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        Brak zapisanych rozmów
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
    list: {
        padding: 16,
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
    sessionTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    sessionDate: {
        fontSize: 13,
    },
    pinIcon: {
        fontSize: 16,
        marginLeft: 8,
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
