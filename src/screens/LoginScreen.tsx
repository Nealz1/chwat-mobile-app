import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../services/authService';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
    const { colors } = useTheme();
    const { language } = useLanguage();
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const t = {
        title: language === 'pl' ? 'Logowanie' : 'Login',
        subtitle: language === 'pl'
            ? 'Zaloguj się przez USOS lub wprowadź token z aplikacji webowej.'
            : 'Log in via USOS or enter a token from the web app.',
        usosButton: language === 'pl' ? '🎓 Zaloguj przez USOS' : '🎓 Login via USOS',
        tokenPlaceholder: language === 'pl' ? 'Lub wklej token tutaj...' : 'Or paste token here...',
        tokenButton: language === 'pl' ? 'Zaloguj z tokenem' : 'Login with token',
        skipLogin: language === 'pl' ? 'Kontynuuj bez logowania' : 'Continue without login',
        tokenHint: language === 'pl'
            ? '💡 Token znajdziesz w ustawieniach konta na stronie webowej.'
            : "💡 You can find the token in account settings on the web app.",
        success: language === 'pl' ? 'Zalogowano jako' : 'Logged in as',
        error: language === 'pl' ? 'Nieprawidłowy token' : 'Invalid token',
        usosError: language === 'pl' ? 'Logowanie przez USOS nie powiodło się' : 'USOS login failed',
    };

    const handleUsosLogin = async () => {
        setIsLoading(true);
        try {
            const success = await authService.login();
            if (success) {
                const user = await authService.getCurrentUser();
                if (user) {
                    Alert.alert('✅', `${t.success} ${user.first_name} ${user.last_name}`, [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]);
                }
            } else {
                Alert.alert('Error', t.usosError);
            }
        } catch (error) {
            console.error('USOS login error:', error);
            Alert.alert('Error', t.usosError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTokenLogin = async () => {
        if (!token.trim()) {
            Alert.alert('Error', t.error);
            return;
        }

        setIsLoading(true);
        try {
            await authService.setToken(token.trim());
            const user = await authService.getCurrentUser();

            if (user) {
                Alert.alert('✅', `${t.success} ${user.first_name} ${user.last_name}`, [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                await authService.removeToken();
                Alert.alert('Error', t.error);
            }
        } catch (error) {
            Alert.alert('Error', t.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {t.title}
                </Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {t.subtitle}
                </Text>

                {/* USOS Login Button */}
                <TouchableOpacity
                    style={[styles.usosButton, { backgroundColor: '#1a4d8f' }]}
                    onPress={handleUsosLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.usosButtonText}>{t.usosButton}</Text>
                    )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                        {language === 'pl' ? 'lub' : 'or'}
                    </Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                {/* Token Input */}
                <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={token}
                        onChangeText={setToken}
                        placeholder={t.tokenPlaceholder}
                        placeholderTextColor={colors.textSecondary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.tokenButton, { backgroundColor: colors.primary }]}
                    onPress={handleTokenLogin}
                    disabled={isLoading || !token.trim()}
                >
                    <Text style={styles.tokenButtonText}>{t.tokenButton}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                        {t.skipLogin}
                    </Text>
                </TouchableOpacity>

                <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        {t.tokenHint}
                    </Text>
                </View>
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
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    usosButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    usosButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 14,
    },
    inputContainer: {
        borderRadius: 12,
        marginBottom: 12,
    },
    input: {
        padding: 16,
        fontSize: 16,
    },
    tokenButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    tokenButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    cancelButton: {
        padding: 12,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
    },
    infoBox: {
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
    },
});
