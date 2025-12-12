import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Switch,
    ScrollView,
    Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../services/authService';
import type { User } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
    const { colors, isDark, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
    };

    const handleLogout = async () => {
        Alert.alert(
            t.settings.logout,
            language === 'pl' ? 'Czy na pewno chcesz się wylogować?' : 'Are you sure you want to log out?',
            [
                { text: t.common.cancel, style: 'cancel' },
                {
                    text: t.settings.logout,
                    style: 'destructive',
                    onPress: async () => {
                        await authService.logout();
                        setUser(null);
                        navigation.navigate('Chat', {});
                    },
                },
            ]
        );
    };

    const handleLogin = () => {
        navigation.navigate('Login');
    };

    const toggleLanguage = () => {
        setLanguage(language === 'pl' ? 'en' : 'pl');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* User Section */}
                {user ? (
                    <View style={[styles.section, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            {t.settings.account.toUpperCase()}
                        </Text>
                        <View style={styles.userInfo}>
                            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarText}>
                                    {user.first_name[0]}{user.last_name[0]}
                                </Text>
                            </View>
                            <View style={styles.userDetails}>
                                <Text style={[styles.userName, { color: colors.text }]}>
                                    {user.first_name} {user.last_name}
                                </Text>
                                <Text style={[styles.userStatus, { color: colors.textSecondary }]}>
                                    {user.student_status === 2 ? 'Student WAT' : 'Pracownik WAT'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.logoutButton, { backgroundColor: colors.error }]}
                            onPress={handleLogout}
                        >
                            <Text style={styles.logoutText}>{t.settings.logout}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.section, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            {t.settings.account.toUpperCase()}
                        </Text>
                        <Text style={[styles.notLoggedIn, { color: colors.text }]}>
                            {t.settings.notLoggedIn}
                        </Text>
                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: colors.primary }]}
                            onPress={handleLogin}
                        >
                            <Text style={styles.loginText}>{t.settings.login}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Appearance Section */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t.settings.theme.toUpperCase()}
                    </Text>
                    <View style={styles.settingRow}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>
                            {t.settings.darkMode}
                        </Text>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Language Section */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t.settings.language.toUpperCase()}
                    </Text>
                    <TouchableOpacity style={styles.settingRow} onPress={toggleLanguage}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>
                            {language === 'pl' ? '🇵🇱 Polski' : '🇬🇧 English'}
                        </Text>
                        <Text style={[styles.settingValue, { color: colors.primary }]}>
                            {language === 'pl' ? 'Zmień na EN' : 'Switch to PL'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* About Section */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {language === 'pl' ? 'INFORMACJE' : 'ABOUT'}
                    </Text>
                    <View style={styles.aboutRow}>
                        <Text style={[styles.aboutLabel, { color: colors.text }]}>{t.settings.version}</Text>
                        <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>1.0.0</Text>
                    </View>
                    <View style={styles.aboutRow}>
                        <Text style={[styles.aboutLabel, { color: colors.text }]}>
                            {language === 'pl' ? 'Aplikacja' : 'App'}
                        </Text>
                        <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>{t.settings.appName}</Text>
                    </View>
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
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    userDetails: {
        marginLeft: 12,
        flex: 1,
    },
    userName: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 2,
    },
    userStatus: {
        fontSize: 14,
    },
    notLoggedIn: {
        fontSize: 16,
        marginBottom: 16,
    },
    logoutButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    loginButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    loginText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    settingLabel: {
        fontSize: 16,
    },
    settingValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    aboutRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    aboutLabel: {
        fontSize: 16,
    },
    aboutValue: {
        fontSize: 16,
    },
});
