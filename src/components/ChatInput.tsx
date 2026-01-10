import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AttachedFile {
    uri: string;
    name: string;
    type?: string;
    mimeType?: string;
}

interface ChatInputProps {
    inputText: string;
    onInputChange: (text: string) => void;
    onSend: () => void;
    onCancel: () => void;
    onAttachFile: () => void;
    onVoiceRecord: () => void;
    isLoading: boolean;
    isRecording: boolean;
    attachedFile: AttachedFile | null;
    onRemoveAttachment: () => void;
    placeholder: string;
    colors: {
        text: string;
        textSecondary: string;
        primary: string;
        background: string;
        surface: string;
        border: string;
        error: string;
    };
    keyboardHeight: number;
    // Autocomplete
    showGroupAutocomplete: boolean;
    groupSuggestions: string[];
    onInsertGroupSuggestion: (suggestion: string) => void;
}

export function ChatInput({
    inputText,
    onInputChange,
    onSend,
    onCancel,
    onAttachFile,
    onVoiceRecord,
    isLoading,
    isRecording,
    attachedFile,
    onRemoveAttachment,
    placeholder,
    colors,
    keyboardHeight,
    showGroupAutocomplete,
    groupSuggestions,
    onInsertGroupSuggestion,
}: ChatInputProps) {
    return (
        <View style={[
            styles.inputContainer,
            {
                backgroundColor: colors.surface,
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: keyboardHeight > 0 ? keyboardHeight : 0,
                paddingBottom: keyboardHeight > 0 ? 50 : 35,
            }
        ]}>
            {/* Attached file indicator */}
            {attachedFile && (
                <View style={[styles.attachedFileRow, { backgroundColor: colors.background }]}>
                    <Text style={[styles.attachedFileName, { color: colors.text }]} numberOfLines={1}>
                        📎 {attachedFile.name}
                    </Text>
                    <TouchableOpacity onPress={onRemoveAttachment}>
                        <Text style={[styles.removeAttachment, { color: colors.error }]}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}
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
                        onChangeText={onInputChange}
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
        </View>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'column',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    inputWithAutocomplete: {
        flex: 1,
        position: 'relative',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
    },
    inputActionButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputActionIcon: {
        fontSize: 28,
        fontWeight: '300',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    attachedFileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    attachedFileName: {
        flex: 1,
        fontSize: 14,
    },
    removeAttachment: {
        fontSize: 16,
        fontWeight: '600',
        paddingHorizontal: 8,
    },
    autocompleteDropdown: {
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 4,
        maxHeight: 200,
        zIndex: 1000,
    },
    autocompleteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        borderBottomWidth: 1,
    },
    autocompleteText: {
        fontSize: 14,
        flex: 1,
    },
});
