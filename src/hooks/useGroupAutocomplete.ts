import { useState, useCallback, useRef } from 'react';
import { groupsService } from '../services/groupsService';

interface UseGroupAutocompleteReturn {
    groupSuggestions: string[];
    showGroupAutocomplete: boolean;
    handleInputChange: (text: string, setInputText: (t: string) => void) => void;
    insertGroupSuggestion: (suggestion: string, inputText: string, setInputText: (t: string) => void) => void;
    clearSuggestions: () => void;
}

export const useGroupAutocomplete = (): UseGroupAutocompleteReturn => {
    const [groupSuggestions, setGroupSuggestions] = useState<string[]>([]);
    const [showGroupAutocomplete, setShowGroupAutocomplete] = useState(false);
    const groupSearchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Detect WCY pattern for group autocomplete
    const detectGroupPattern = useCallback((text: string): string | null => {
        const match = text.match(/(?:^|\s)([Ww][Cc][Yy][a-zA-Z0-9]*)$/);
        return match ? match[1].toUpperCase() : null;
    }, []);

    // Handle input change with group pattern detection
    const handleInputChange = useCallback((text: string, setInputText: (t: string) => void) => {
        setInputText(text);

        // Clear previous timeout
        if (groupSearchTimeout.current) {
            clearTimeout(groupSearchTimeout.current);
        }

        // Detect WCY pattern
        const pattern = detectGroupPattern(text);
        if (pattern && pattern.length >= 3) {
            // Debounce search
            groupSearchTimeout.current = setTimeout(async () => {
                try {
                    const groups = await groupsService.searchGroups(pattern);
                    setGroupSuggestions(groups);
                    setShowGroupAutocomplete(groups.length > 0);
                } catch (error) {
                    console.error('Error searching groups:', error);
                    setGroupSuggestions([]);
                    setShowGroupAutocomplete(false);
                }
            }, 300);
        } else {
            setGroupSuggestions([]);
            setShowGroupAutocomplete(false);
        }
    }, [detectGroupPattern]);

    // Insert selected group suggestion
    const insertGroupSuggestion = useCallback((
        suggestion: string,
        inputText: string,
        setInputText: (t: string) => void
    ) => {
        const match = inputText.match(/(?:^|\s)([Ww][Cc][Yy][a-zA-Z0-9]*)$/);
        if (match) {
            const patternStart = inputText.length - match[1].length;
            const newText = inputText.substring(0, patternStart) + suggestion;
            setInputText(newText);
        }
        setGroupSuggestions([]);
        setShowGroupAutocomplete(false);
    }, []);

    // Clear suggestions
    const clearSuggestions = useCallback(() => {
        setGroupSuggestions([]);
        setShowGroupAutocomplete(false);
    }, []);

    return {
        groupSuggestions,
        showGroupAutocomplete,
        handleInputChange,
        insertGroupSuggestion,
        clearSuggestions,
    };
};

export default useGroupAutocomplete;
