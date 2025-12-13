import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

export interface ThemeColors {
    primary: string;
    background: string;
    surface: string;
    surfaceAlt: string;
    sidebar: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    header: string;
}

// Matching web frontend colors
const lightColors: ThemeColors = {
    primary: '#e67e22', // Orange accent like web
    background: '#ffffff',
    surface: '#f5f5f5',
    surfaceAlt: '#e8e8e8',
    sidebar: '#2d2d2d',
    text: '#1a1a1a',
    textSecondary: '#6b6b6b',
    border: '#e0e0e0',
    error: '#e74c3c',
    success: '#27ae60',
    header: '#2d2d2d',
};

const darkColors: ThemeColors = {
    primary: '#e67e22', // Orange accent like web
    background: '#242424', // --bg-primary from web
    surface: '#2d2d2d',
    surfaceAlt: '#353535',
    sidebar: '#242424',
    text: '#ffffff',
    textSecondary: '#888888',
    border: '#3d3d3d',
    error: '#e74c3c',
    success: '#27ae60',
    header: '#242424',
};

interface ThemeContextType {
    isDark: boolean;
    colors: ThemeColors;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(true); // Default to dark like web

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

    return (
        <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
