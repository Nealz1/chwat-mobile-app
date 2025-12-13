import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
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
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const t = {
        title: language === 'pl' ? 'Logowanie' : 'Login',
        subtitle: language === 'pl'
            ? 'Zaloguj się przez USOS, a następnie skopiuj token z ustawień konta.'
            : 'Log in via USOS, then copy the token from account settings.',
        usosButton: language === 'pl' ? '🎓 Otwórz stronę logowania USOS' : '🎓 Open USOS login page',
        tokenPlaceholder: language === 'pl' ? 'Wklej token tutaj...' : 'Paste token here...',
        tokenButton: language === 'pl' ? 'Zaloguj z tokenem' : 'Login with token',
        skipLogin: language === 'pl' ? 'Kontynuuj bez logowania' : 'Continue without login',
        step1: language === 'pl' ? '1️⃣ Kliknij przycisk poniżej, aby otworzyć USOS' : '1️⃣ Click button below to open USOS',
        step2: language === 'pl' ? '2️⃣ Zaloguj się na stronie' : '2️⃣ Log in on the website',
        step3: language === 'pl' ? '3️⃣ Skopiuj token z ustawień konta' : '3️⃣ Copy token from account settings',
        step4: language === 'pl' ? '4️⃣ Wklej token powyżej' : '4️⃣ Paste token above',
        success: language === 'pl' ? 'Zalogowano jako' : 'Logged in as',
        error: language === 'pl' ? 'Nieprawidłowy token' : 'Invalid token',
        browserOpened: language === 'pl' ? 'Przeglądarka została otwarta' : 'Browser opened',
    };

    const handleOpenUsos = async () => {
        setIsLoading(true);
        try {
            await authService.login();
            Alert.alert('✅', t.browserOpened);
        } catch (error) {
            console.error('Error opening USOS:', error);
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

                {/* Steps */}
                <View style={[styles.stepsBox, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.stepText, { color: colors.text }]}>{t.step1}</Text>
                    <Text style={[styles.stepText, { color: colors.text }]}>{t.step2}</Text>
                    <Text style={[styles.stepText, { color: colors.text }]}>{t.step3}</Text>
                    <Text style={[styles.stepText, { color: colors.text }]}>{t.step4}</Text>
                </View>

                {/* USOS Button */}
                <TouchableOpacity
                    style={[styles.usosButton, { backgroundColor: '#1a4d8f' }]}
                    onPress={handleOpenUsos}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.usosButtonText}>{t.usosButton}</Text>
                    )}
                </TouchableOpacity>

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
                    style={[
                        styles.tokenButton,
                        { backgroundColor: token.trim() ? colors.primary : colors.border }
                    ]}
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
        marginBottom: 24,
        lineHeight: 22,
    },
    stepsBox: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    stepText: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    usosButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    usosButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
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
});
