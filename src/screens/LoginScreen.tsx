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
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
    const { colors } = useTheme();
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);

    const t = {
        title: language === 'pl' ? 'Witaj!' : 'Welcome!',
        subtitle: language === 'pl'
            ? 'Zaloguj się, aby uzyskać pełny dostęp'
            : 'Sign in to get full access',
        usosButton: language === 'pl' ? 'Zaloguj przez USOS' : 'Sign in with USOS',
        skipLogin: language === 'pl' ? 'Pomiń' : 'Skip',
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
                    Alert.alert('✅', `${t.success} ${user.first_name}`, [
                        {
                            text: 'OK',
                            onPress: () => {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Chat', params: { newChat: Date.now() } }],
                                });
                            }
                        }
                    ]);
                } else {
                    Alert.alert('❌', t.error);
                }
            } else {
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

                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="school-outline" size={48} color={colors.primary} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                    {t.title}
                </Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {t.subtitle}
                </Text>


                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={handleOAuthLogin}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={styles.primaryButtonText}>{t.usosButton}</Text>
                    )}
                </TouchableOpacity>


                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => navigation.goBack()}
                    disabled={isLoading}
                >
                    <Text style={[styles.skipText, { color: colors.textSecondary }]}>
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
        paddingHorizontal: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 48,
    },
    primaryButton: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 16,
    },
    buttonIcon: {
        marginRight: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    skipButton: {
        padding: 12,
    },
    skipText: {
        fontSize: 14,
    },
});
