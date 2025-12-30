import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,

    Switch,
    ScrollView,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../services/authService';
import type { User } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;
type TabType = 'general' | 'account';

interface AccountInfo {
    firstName: string;
    lastName: string;
    groupName: string;
    studentIndex: string;
    phoneNumber: string;
    email: string;
    faculty: string;
    studyLevel: string;
    street: string;
    buildingNumber: string;
    apartmentNumber: string;
    postalCode: string;
    city: string;
}

const ACCOUNT_STORAGE_KEY = 'account_info';

export function SettingsScreen({ navigation }: Props) {
    const { colors, isDark, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [accountInfo, setAccountInfo] = useState<AccountInfo>({
        firstName: '',
        lastName: '',
        groupName: '',
        studentIndex: '',
        phoneNumber: '',
        email: '',
        faculty: '',
        studyLevel: '',
        street: '',
        buildingNumber: '',
        apartmentNumber: '',
        postalCode: '',
        city: '',
    });

    useEffect(() => {
        loadUser();
        loadAccountInfo();
    }, []);

    const loadUser = async () => {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
            setAccountInfo(prev => ({
                ...prev,
                firstName: currentUser.first_name || '',
                lastName: currentUser.last_name || '',
            }));
        }
    };

    const loadAccountInfo = async () => {
        try {
            const preferences = await authService.getAccountPreferences();
            if (preferences?.preferences) {
                const prefs = preferences.preferences;
                setAccountInfo(prev => ({
                    ...prev,
                    groupName: prefs.group_name || '',
                    studentIndex: prefs.student_index || '',
                    phoneNumber: prefs.phone_number || '',
                    email: prefs.email_username || '',
                    faculty: prefs.faculty || '',
                    studyLevel: prefs.study_level || '',
                    street: prefs.street || '',
                    buildingNumber: prefs.building_number || '',
                    apartmentNumber: prefs.apartment_number || '',
                    postalCode: prefs.postal_code || '',
                    city: prefs.city || '',
                }));
            }
        } catch (error) {
            console.error('Error loading account info:', error);
        }
    };

    const saveAccountInfo = async (info: AccountInfo) => {
        try {
            await authService.updateAccountPreferences({
                group_name: info.groupName,
                student_index: info.studentIndex,
                phone_number: info.phoneNumber,
                email_username: info.email,
                faculty: info.faculty,
                study_level: info.studyLevel,
                street: info.street,
                building_number: info.buildingNumber,
                apartment_number: info.apartmentNumber,
                postal_code: info.postalCode,
                city: info.city,
            });
        } catch (error) {
            console.error('Error saving account info:', error);
        }
    };

    const updateAccountField = (field: keyof AccountInfo, value: string) => {
        const updated = { ...accountInfo, [field]: value };
        setAccountInfo(updated);
        saveAccountInfo(updated);
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

    const renderTab = (tab: TabType, label: string) => (
        <TouchableOpacity
            key={tab}
            style={[
                styles.tab,
                activeTab === tab && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab(tab)}
        >
            <Text style={[
                styles.tabText,
                { color: activeTab === tab ? '#FFFFFF' : colors.text },
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const facultyOptions = [
        { value: '', label: language === 'pl' ? 'Wybierz wydział' : 'Select faculty' },
        { value: 'WCY', label: 'WCY - Wydział Cybernetyki' },
        { value: 'WEL', label: 'WEL - Wydział Elektroniki' },
        { value: 'WIG', label: 'WIG - Wydział Inżynierii Lądowej i Geodezji' },
        { value: 'WIM', label: 'WIM - Wydział Inżynierii Mechanicznej' },
        { value: 'WLO', label: 'WLO - Wydział Lotnictwa i Kosmonautyki' },
        { value: 'WML', label: 'WML - Wydział Mechaniczny' },
        { value: 'WTC', label: 'WTC - Wydział Techniki Chemicznej' },
        { value: 'IOE', label: 'IOE - Instytut Optoelektroniki' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {renderTab('general', language === 'pl' ? 'Ogólne' : 'General')}
                {user && renderTab('account', language === 'pl' ? 'Konto' : 'Account')}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {activeTab === 'general' && (
                    <>
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

                        {/* Theme Section */}
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
                    </>
                )}

                {activeTab === 'account' && user && (
                    <>
                        {/* Personal Info */}
                        <View style={[styles.section, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                {language === 'pl' ? 'DANE OSOBOWE' : 'PERSONAL INFO'}
                            </Text>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    {language === 'pl' ? 'Imię' : 'First Name'}
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    value={accountInfo.firstName}
                                    onChangeText={(v) => updateAccountField('firstName', v)}
                                    placeholder={language === 'pl' ? 'Wprowadź imię' : 'Enter first name'}
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    {language === 'pl' ? 'Nazwisko' : 'Last Name'}
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    value={accountInfo.lastName}
                                    onChangeText={(v) => updateAccountField('lastName', v)}
                                    placeholder={language === 'pl' ? 'Wprowadź nazwisko' : 'Enter last name'}
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    {language === 'pl' ? 'Telefon' : 'Phone'}
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    value={accountInfo.phoneNumber}
                                    onChangeText={(v) => updateAccountField('phoneNumber', v)}
                                    placeholder={language === 'pl' ? 'Numer telefonu' : 'Phone number'}
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    value={accountInfo.email}
                                    onChangeText={(v) => updateAccountField('email', v)}
                                    placeholder={language === 'pl' ? 'Nazwa użytkownika email' : 'Email username'}
                                    placeholderTextColor={colors.textSecondary}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* Academic Info */}
                        <View style={[styles.section, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                {language === 'pl' ? 'DANE STUDENTA' : 'STUDENT INFO'}
                            </Text>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    {language === 'pl' ? 'Grupa' : 'Group'}
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    value={accountInfo.groupName}
                                    onChangeText={(v) => updateAccountField('groupName', v)}
                                    placeholder="np. WCY21IL1S0"
                                    placeholderTextColor={colors.textSecondary}
                                    autoCapitalize="characters"
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    {language === 'pl' ? 'Indeks' : 'Student ID'}
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    value={accountInfo.studentIndex}
                                    onChangeText={(v) => updateAccountField('studentIndex', v)}
                                    placeholder={language === 'pl' ? 'Numer indeksu' : 'Student ID number'}
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    {language === 'pl' ? 'Wydział' : 'Faculty'}
                                </Text>
                                <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                                    <Picker
                                        selectedValue={accountInfo.faculty}
                                        onValueChange={(v) => updateAccountField('faculty', v as string)}
                                        style={{ color: colors.text }}
                                    >
                                        {facultyOptions.map(opt => (
                                            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    {language === 'pl' ? 'Poziom studiów' : 'Study Level'}
                                </Text>
                                <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                                    <Picker
                                        selectedValue={accountInfo.studyLevel}
                                        onValueChange={(v) => updateAccountField('studyLevel', v as string)}
                                        style={{ color: colors.text }}
                                    >
                                        <Picker.Item label={language === 'pl' ? 'Wybierz poziom' : 'Select level'} value="" />
                                        <Picker.Item label={language === 'pl' ? 'Inżynierskie (I stopień)' : 'Bachelor (1st degree)'} value="engineer" />
                                        <Picker.Item label={language === 'pl' ? 'Magisterskie (II stopień)' : 'Master (2nd degree)'} value="master" />
                                        <Picker.Item label={language === 'pl' ? 'Jednolite magisterskie' : 'Unified Master'} value="unified" />
                                        <Picker.Item label={language === 'pl' ? 'Doktoranckie' : 'Doctoral'} value="doctoral" />
                                    </Picker>
                                </View>
                            </View>
                        </View>

                        {/* Address Section */}
                        <View style={[styles.section, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                {language === 'pl' ? 'ADRES' : 'ADDRESS'}
                            </Text>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    {language === 'pl' ? 'Ulica' : 'Street'}
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    value={accountInfo.street}
                                    onChangeText={(v) => updateAccountField('street', v)}
                                    placeholder={language === 'pl' ? 'Nazwa ulicy' : 'Street name'}
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    {language === 'pl' ? 'Nr budynku' : 'Building No.'}
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    value={accountInfo.buildingNumber}
                                    onChangeText={(v) => updateAccountField('buildingNumber', v)}
                                    placeholder="np. 12A"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    {language === 'pl' ? 'Nr mieszkania' : 'Apt No.'}
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    value={accountInfo.apartmentNumber}
                                    onChangeText={(v) => updateAccountField('apartmentNumber', v)}
                                    placeholder="np. 5"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    {language === 'pl' ? 'Kod pocztowy' : 'Postal Code'}
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    value={accountInfo.postalCode}
                                    onChangeText={(v) => updateAccountField('postalCode', v)}
                                    placeholder="00-000"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    {language === 'pl' ? 'Miasto' : 'City'}
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    value={accountInfo.city}
                                    onChangeText={(v) => updateAccountField('city', v)}
                                    placeholder={language === 'pl' ? 'Nazwa miasta' : 'City name'}
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '500',
    },
    content: {
        padding: 16,
        paddingTop: 0,
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
    inputRow: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 6,
        fontWeight: '500',
    },
    input: {
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    pickerContainer: {
        borderRadius: 8,
        overflow: 'hidden',
    },
});
