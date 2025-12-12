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
    const { t } = useLanguage();
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleTokenLogin = async () => {
        if (!token.trim()) {
            Alert.alert('Error', t.login.error);
            return;
        }

        setIsLoading(true);
        try {
            await authService.setToken(token.trim());
            const user = await authService.getCurrentUser();

            if (user) {
                Alert.alert('✅', `${t.login.success} ${user.first_name} ${user.last_name}`, [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                await authService.removeToken();
                Alert.alert('Error', t.login.error);
            }
        } catch (error) {
            Alert.alert('Error', t.login.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {t.login.title}
                </Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {t.login.subtitle}
                </Text>

                <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={token}
                        onChangeText={setToken}
                        placeholder={t.login.tokenPlaceholder}
                        placeholderTextColor={colors.textSecondary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleTokenLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>{t.login.loginButton}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                        {t.login.skipLogin}
                    </Text>
                </TouchableOpacity>

                <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        {t.login.tokenHint}
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
    inputContainer: {
        borderRadius: 12,
        marginBottom: 16,
    },
    input: {
        padding: 16,
        fontSize: 16,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonText: {
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
        marginTop: 32,
        padding: 16,
        borderRadius: 12,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
    },
});
