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

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
    const { colors, isDark, toggleTheme } = useTheme();
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
            'Wyloguj',
            'Czy na pewno chcesz się wylogować?',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Wyloguj',
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* User Section */}
                {user ? (
                    <View style={[styles.section, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            KONTO
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
                            <Text style={styles.logoutText}>Wyloguj się</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.section, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            KONTO
                        </Text>
                        <Text style={[styles.notLoggedIn, { color: colors.text }]}>
                            Nie jesteś zalogowany
                        </Text>
                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: colors.primary }]}
                            onPress={handleLogin}
                        >
                            <Text style={styles.loginText}>Zaloguj się</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Appearance Section */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        WYGLĄD
                    </Text>
                    <View style={styles.settingRow}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>
                            Tryb ciemny
                        </Text>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* About Section */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        INFORMACJE
                    </Text>
                    <View style={styles.aboutRow}>
                        <Text style={[styles.aboutLabel, { color: colors.text }]}>Wersja</Text>
                        <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>1.0.0</Text>
                    </View>
                    <View style={styles.aboutRow}>
                        <Text style={[styles.aboutLabel, { color: colors.text }]}>Aplikacja</Text>
                        <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>WAT Helpdesk Mobile</Text>
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
    },
    settingLabel: {
        fontSize: 16,
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
