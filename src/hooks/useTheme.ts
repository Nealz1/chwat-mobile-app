import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { STORAGE_KEYS } from '../config/constants';

export interface ThemeColors {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
}

const lightColors: ThemeColors = {
    primary: '#007AFF',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    error: '#FF3B30',
    success: '#34C759',
};

const darkColors: ThemeColors = {
    primary: '#0A84FF',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    error: '#FF453A',
    success: '#30D158',
};

export function useTheme() {
    const systemColorScheme = useColorScheme();
    const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE);
            if (saved !== null) {
                setIsDark(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const toggleTheme = useCallback(async () => {
        const newValue = !isDark;
        setIsDark(newValue);
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(newValue));
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }, [isDark]);

    const colors = isDark ? darkColors : lightColors;

    return {
        isDark,
        colors,
        toggleTheme,
    };
}
