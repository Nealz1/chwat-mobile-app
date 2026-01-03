import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { chatService } from '../services/chatService';
import type { ChatSession } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Archives'>;

export function ArchivesScreen({ navigation }: Props) {
    const { colors } = useTheme();
    const { language } = useLanguage();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadArchivedSessions();
    }, []);

    const loadArchivedSessions = async () => {
        setLoading(true);
        try {
            const allSessions = await chatService.getSessions(true);
            // Filter to show only archived sessions
            const archived = allSessions.filter(s => s.is_archived);
            setSessions(archived);
        } catch (error) {
            console.error('Error loading archived sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnarchive = async (session: ChatSession) => {
        const success = await chatService.unarchiveSession(session.id);
        if (success) {
            setSessions(prev => prev.filter(s => s.id !== session.id));
        }
    };

    const handleDelete = (session: ChatSession) => {
        Alert.alert(
            language === 'pl' ? 'Usuń rozmowę' : 'Delete chat',
            language === 'pl' ? 'Czy na pewno chcesz usunąć tę rozmowę?' : 'Are you sure you want to delete this chat?',
            [
                { text: language === 'pl' ? 'Anuluj' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'pl' ? 'Usuń' : 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await chatService.deleteSession(session.id);
                        if (success) {
                            setSessions(prev => prev.filter(s => s.id !== session.id));
                        }
                    }
                }
            ]
        );
    };

    const handleOpenChat = (session: ChatSession) => {
        navigation.navigate('Chat', { sessionId: session.id });
    };

    const renderSession = ({ item }: { item: ChatSession }) => (
        <View style={[styles.sessionItem, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
                style={styles.sessionMain}
                onPress={() => handleOpenChat(item)}
            >
                <Ionicons name="archive-outline" size={22} color={colors.text} style={styles.sessionIconStyle} />
                <View style={styles.sessionInfo}>
                    <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                        {new Date(item.updated_at).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US')}
                    </Text>
                </View>
            </TouchableOpacity>
            <View style={styles.sessionActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleUnarchive(item)}
                >
                    <Ionicons name="arrow-undo-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(item)}
                >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {sessions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="archive-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {language === 'pl' ? 'Brak zarchiwizowanych rozmów' : 'No archived chats'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={sessions}
                    renderItem={renderSession}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
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
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    sessionMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sessionIconStyle: {
        marginRight: 12,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    sessionDate: {
        fontSize: 12,
        marginTop: 2,
    },
    sessionActions: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
    },
    actionIcon: {
        fontSize: 18,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
    },
});
