import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface Suggestion {
    text: string;
    query: string;
    icon: string;
    category: string;
}

interface SuggestionsData {
    type: string;
    suggestions: Suggestion[];
}

interface SuggestionsProps {
    data: SuggestionsData;
    onSuggestionPress: (query: string) => void;
}

export const Suggestions = memo(({ data, onSuggestionPress }: SuggestionsProps) => {
    if (!data?.suggestions || data.suggestions.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.icon}>💡</Text>
                <Text style={styles.title}>Może chcesz też:</Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}
            >
                {data.suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.button}
                        onPress={() => onSuggestionPress(suggestion.query)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.buttonIcon}>{suggestion.icon}</Text>
                        <Text style={styles.buttonText}>
                            {suggestion.text.replace(/^[^\s]+\s/, '')}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    icon: {
        fontSize: 16,
    },
    title: {
        fontWeight: '500',
        fontSize: 14,
        color: '#1f2937',
    },
    list: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        borderRadius: 20,
    },
    buttonIcon: {
        fontSize: 14,
    },
    buttonText: {
        fontSize: 13,
        color: '#374151',
    },
});
