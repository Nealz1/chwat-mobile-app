import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationsType } from '../config/translations';
import { STORAGE_KEYS } from '../config/constants';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslationsType;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<Language>('pl');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
            if (saved === 'en' || saved === 'pl') {
                setLanguageState(saved);
            }
        } catch (error) {
            console.error('Error loading language:', error);
        } finally {
            setIsLoaded(true);
        }
    };

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    const t = translations[language];

    if (!isLoaded) {
        return null;
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
