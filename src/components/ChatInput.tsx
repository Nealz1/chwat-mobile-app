import React, { memo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../contexts/ThemeContext';

interface ChatInputProps {
    inputText: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    isLoading: boolean;
    isRecording: boolean;
    colors: ThemeColors;
    groupSuggestions: string[];
    showGroupAutocomplete: boolean;
    onInsertGroupSuggestion: (suggestion: string) => void;
    onAttachFile: () => void;
    onVoiceRecord: () => void;
    onSend: () => void;
    onCancel: () => void;
}

export const ChatInput = memo(({
    inputText,
    onChangeText,
    placeholder,
    isLoading,
    isRecording,
    colors,
    groupSuggestions,
    showGroupAutocomplete,
    onInsertGroupSuggestion,
    onAttachFile,
    onVoiceRecord,
    onSend,
    onCancel,
}: ChatInputProps) => {
    return (
        <View style={styles.inputRow}>
            {/* Attach file button */}
            <TouchableOpacity
                style={styles.inputActionButton}
                onPress={onAttachFile}
                disabled={isLoading}
            >
                <Text style={[styles.inputActionIcon, { color: colors.textSecondary }]}>+</Text>
            </TouchableOpacity>

            <View style={styles.inputWithAutocomplete}>
                {/* Group autocomplete dropdown */}
                {showGroupAutocomplete && groupSuggestions.length > 0 && (
                    <View style={[styles.autocompleteDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {groupSuggestions.map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.autocompleteItem, { borderBottomColor: colors.border }]}
                                onPress={() => onInsertGroupSuggestion(suggestion)}
                            >
                                <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                                <Text style={[styles.autocompleteText, { color: colors.text }]}>{suggestion}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                    value={inputText}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    maxLength={4000}
                    editable={!isLoading}
                />
            </View>

            {/* Voice record button */}
            <TouchableOpacity
                style={styles.inputActionButton}
                onPress={onVoiceRecord}
                disabled={isLoading}
            >
                <Ionicons
                    name={isRecording ? "stop-circle" : "mic-outline"}
                    size={24}
                    color={isRecording ? colors.error : colors.textSecondary}
                />
            </TouchableOpacity>

            {/* Send/Cancel button */}
            {isLoading ? (
                <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: colors.error }]}
                    onPress={onCancel}
                >
                    <Ionicons name="stop" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        { backgroundColor: inputText.trim() ? colors.primary : colors.border }
                    ]}
                    onPress={onSend}
                    disabled={!inputText.trim()}
                >
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    inputActionButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputActionIcon: {
        fontSize: 26,
        fontWeight: '300',
    },
    inputWithAutocomplete: {
        flex: 1,
        position: 'relative',
    },
    autocompleteDropdown: {
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        marginBottom: 4,
        borderRadius: 8,
        borderWidth: 1,
        maxHeight: 200,
        zIndex: 100,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    autocompleteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        gap: 8,
    },
    autocompleteText: {
        fontSize: 14,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 22,
        fontSize: 16,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default ChatInput;
