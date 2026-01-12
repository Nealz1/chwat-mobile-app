import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
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

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

interface SearchResult {
    sessionId: number;
    sessionTitle: string;
    matchedMessage: string;
    updatedAt: string;
}

export function SearchScreen({ navigation }: Props) {
    const { colors } = useTheme();
    const { language } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const data = await chatService.getSessions(false);
            setSessions(data.filter(s => !s.is_archived));
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    };

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setHasSearched(false);
            return;
        }

        setIsSearching(true);
        setHasSearched(true);

        try {
            const messageResults = await chatService.searchInMessages(sessions, query);

            const lowerQuery = query.toLowerCase();
            const titleResults: SearchResult[] = sessions
                .filter(s =>
                    s.title.toLowerCase().includes(lowerQuery) &&
                    !messageResults.some(r => r.sessionId === s.id)
                )
                .map(s => ({
                    sessionId: s.id,
                    sessionTitle: s.title,
                    matchedMessage: '',
                    updatedAt: s.updated_at,
                }));

            setSearchResults([...messageResults, ...titleResults]);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, [sessions]);

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, performSearch]);

    const handleSelectResult = (sessionId: number) => {
        navigation.navigate('Chat', { sessionId });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return language === 'pl' ? 'Dziś' : 'Today';
        if (diffDays === 1) return language === 'pl' ? 'Wczoraj' : 'Yesterday';
        return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US');
    };

    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts;
    };

    const renderResult = ({ item }: { item: SearchResult }) => {
        const titleParts = highlightMatch(item.sessionTitle, searchQuery);

        return (
            <TouchableOpacity
                style={[styles.resultItem, { backgroundColor: colors.surface }]}
                onPress={() => handleSelectResult(item.sessionId)}
            >
                <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
                <View style={styles.resultContent}>
                    <Text style={[styles.resultTitle, { color: colors.text }]}>
                        {typeof titleParts === 'string' ? titleParts : titleParts.map((part, i) => (
                            <Text key={i} style={part.toLowerCase() === searchQuery.toLowerCase() ? styles.highlight : undefined}>
                                {part}
                            </Text>
                        ))}
                    </Text>
                    {item.matchedMessage ? (
                        <Text style={[styles.resultMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                            {item.matchedMessage}
                        </Text>
                    ) : null}
                    <Text style={[styles.resultDate, { color: colors.textSecondary }]}>
                        {formatDate(item.updatedAt)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder={language === 'pl' ? 'Szukaj w rozmowach...' : 'Search chats...'}
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            
            <View style={styles.content}>
                {!searchQuery && (
                    <View style={styles.emptyState}>
                        <Ionicons name="search" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {language === 'pl' ? 'Wpisz szukane słowo' : 'Enter search term'}
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                            {language === 'pl'
                                ? 'Przeszukuj tytuły i treść wiadomości'
                                : 'Search titles and message content'}
                        </Text>
                    </View>
                )}

                {searchQuery && isSearching && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                            {language === 'pl' ? 'Szukam...' : 'Searching...'}
                        </Text>
                    </View>
                )}

                {searchQuery && !isSearching && hasSearched && searchResults.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="search" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {language === 'pl' ? 'Brak wyników' : 'No results found'}
                        </Text>
                    </View>
                )}

                {searchQuery && !isSearching && searchResults.length > 0 && (
                    <FlatList
                        data={searchResults}
                        renderItem={renderResult}
                        keyExtractor={(item) => `${item.sessionId}`}
                        contentContainerStyle={styles.resultsList}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
        borderBottomWidth: 1,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    content: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '500',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    resultsList: {
        padding: 12,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        gap: 12,
    },
    resultContent: {
        flex: 1,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    resultMessage: {
        fontSize: 14,
        marginTop: 4,
    },
    resultDate: {
        fontSize: 12,
        marginTop: 4,
    },
    highlight: {
        fontWeight: '700',
        backgroundColor: 'rgba(255, 200, 0, 0.3)',
    },
});
