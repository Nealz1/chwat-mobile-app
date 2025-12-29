import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
    const { colors } = useTheme();
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);

    const t = {
        title: language === 'pl' ? 'Logowanie' : 'Login',
        subtitle: language === 'pl'
            ? 'Zaloguj się przez USOS, aby uzyskać dostęp do pełnych funkcji.'
            : 'Log in via USOS to access full features.',
        usosButton: language === 'pl' ? '🎓 Zaloguj przez USOS' : '🎓 Login with USOS',
        skipLogin: language === 'pl' ? 'Kontynuuj bez logowania' : 'Continue without login',
        success: language === 'pl' ? 'Zalogowano jako' : 'Logged in as',
        error: language === 'pl' ? 'Logowanie nie powiodło się' : 'Login failed',
        cancelled: language === 'pl' ? 'Logowanie anulowane' : 'Login cancelled',
    };

    const handleOAuthLogin = async () => {
        setIsLoading(true);
        try {
            const token = await authService.loginWithOAuth();

            if (token) {
                const user = await authService.getCurrentUser();
                if (user) {
                    Alert.alert('✅', `${t.success} ${user.first_name} ${user.last_name}`, [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]);
                } else {
                    Alert.alert('❌', t.error);
                }
            } else {
                // User cancelled or closed browser
                Alert.alert('ℹ️', t.cancelled);
            }
        } catch (error) {
            console.error('OAuth error:', error);
            Alert.alert('❌', t.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Logo/Icon area */}
                <View style={styles.logoArea}>
                    <Text style={styles.logoEmoji}>🎓</Text>
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                    {t.title}
                </Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {t.subtitle}
                </Text>

                {/* USOS OAuth Button */}
                <TouchableOpacity
                    style={[styles.usosButton, { backgroundColor: '#1a4d8f' }]}
                    onPress={handleOAuthLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={styles.usosButtonText}>{t.usosButton}</Text>
                    )}
                </TouchableOpacity>

                {/* Skip/Cancel */}
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                    disabled={isLoading}
                >
                    <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                        {t.skipLogin}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoArea: {
        marginBottom: 24,
    },
    logoEmoji: {
        fontSize: 64,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    usosButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
    },
    usosButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    cancelButton: {
        padding: 16,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
    },
});
