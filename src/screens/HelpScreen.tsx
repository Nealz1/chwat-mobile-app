import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Help'>;

interface Capability {
    icon: string;
    titlePl: string;
    titleEn: string;
    descPl: string;
    descEn: string;
}

const capabilities: Capability[] = [
    {
        icon: '📅',
        titlePl: 'Plany Zajęć',
        titleEn: 'Class Schedules',
        descPl: 'Sprawdź plan dla dowolnej grupy, zobacz zajęcia na dziś lub konkretną datę',
        descEn: 'Get schedules for any group, check your classes for today or specific dates',
    },
    {
        icon: '📞',
        titlePl: 'Informacje Kontaktowe',
        titleEn: 'Contact Information',
        descPl: 'Znajdź adresy email, numery telefonów i godziny dyżurów wykładowców',
        descEn: 'Find email addresses, phone numbers, and office hours for professors',
    },
    {
        icon: '📝',
        titlePl: 'Formularze Uczelni',
        titleEn: 'University Forms',
        descPl: 'Generuj i wypełniaj automatycznie oficjalne formularze uczelni',
        descEn: 'Generate and fill out official university forms automatically',
    },
    {
        icon: '🗺️',
        titlePl: 'Nawigacja po Kampusie',
        titleEn: 'Campus Navigation',
        descPl: 'Uzyskaj wskazówki i trasy do budynków, sal i lokalizacji',
        descEn: 'Get directions and routes to buildings, classrooms, and locations',
    },
    {
        icon: '✉️',
        titlePl: 'Pomoc z Emailami',
        titleEn: 'Email Assistance',
        descPl: 'Pomoc w tworzeniu emaili do wykładowców z właściwym formatowaniem',
        descEn: 'Get help composing emails to professors with proper formatting',
    },
    {
        icon: '📊',
        titlePl: 'Informacje o Ocenach',
        titleEn: 'Grade Information',
        descPl: 'Sprawdź swoją średnią ocen i wyniki akademickie',
        descEn: 'Check your average grades and academic performance',
    },
    {
        icon: 'ℹ️',
        titlePl: 'Ogólne Informacje',
        titleEn: 'General Information',
        descPl: 'Pytaj o zasady uczelni, terminy, wymagania i inne informacje',
        descEn: 'Ask about university policies, deadlines, requirements, and other info',
    },
];

const examplesPl = [
    'Jaki jest plan zajęć dla WCY21IL1S0 na 25 października?',
    'Potrzebuję informacji kontaktowych do profesora Kowalskiego',
    'Jak dojść do budynku 307?',
    'Jaka jest moja obecna średnia ocen?',
];

const examplesEn = [
    "What's the schedule for WCY21IL1S0 on October 25?",
    'I need contact info for Professor Kowalski',
    'How do I get to building 307?',
    "What's my current grade average?",
];

export function HelpScreen({ navigation }: Props) {
    const { colors } = useTheme();
    const { language } = useLanguage();
    const isPl = language === 'pl';

    const examples = isPl ? examplesPl : examplesEn;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Intro */}
                <Text style={[styles.intro, { color: colors.textSecondary }]}>
                    {isPl
                        ? 'Jestem Twoim asystentem studenckim WAT. Oto w czym mogę Ci pomóc:'
                        : "I'm your WAT student assistant. Here's what I can help you with:"}
                </Text>

                {/* Capabilities */}
                <View style={styles.capabilitiesList}>
                    {capabilities.map((cap, index) => (
                        <View
                            key={index}
                            style={[styles.capabilityItem, { backgroundColor: colors.surface }]}
                        >
                            <Text style={styles.capabilityIcon}>{cap.icon}</Text>
                            <View style={styles.capabilityText}>
                                <Text style={[styles.capabilityTitle, { color: colors.text }]}>
                                    {isPl ? cap.titlePl : cap.titleEn}
                                </Text>
                                <Text style={[styles.capabilityDesc, { color: colors.textSecondary }]}>
                                    {isPl ? cap.descPl : cap.descEn}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Examples */}
                <View style={[styles.examplesSection, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.examplesTitle, { color: colors.text }]}>
                        {isPl ? 'Przykładowe pytania:' : 'Example Questions:'}
                    </Text>
                    {examples.map((example, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.exampleItem, { borderColor: colors.border }]}
                            onPress={() => {
                                navigation.navigate('Chat', {});
                                // Could pre-fill the input with the example
                            }}
                        >
                            <Text style={[styles.exampleText, { color: colors.primary }]}>
                                "{example}"
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    intro: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
    capabilitiesList: {
        marginBottom: 24,
    },
    capabilityItem: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
    },
    capabilityIcon: {
        fontSize: 28,
        marginRight: 14,
    },
    capabilityText: {
        flex: 1,
    },
    capabilityTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    capabilityDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    examplesSection: {
        borderRadius: 12,
        padding: 16,
    },
    examplesTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    exampleItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    exampleText: {
        fontSize: 15,
        fontStyle: 'italic',
    },
});
