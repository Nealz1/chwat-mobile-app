import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
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
import { settingsScreenStyles as styles } from '../styles/settingsScreenStyles';

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
        { value: 'Wydział Cybernetyki', label: 'WCY - Wydział Cybernetyki' },
        { value: 'Wydział Elektroniki', label: 'WEL - Wydział Elektroniki' },
        { value: 'Wydział Inżynierii Lądowej i Geodezji', label: 'WIG - Wydział Inżynierii Lądowej i Geodezji' },
        { value: 'Wydział Inżynierii Mechanicznej', label: 'WIM - Wydział Inżynierii Mechanicznej' },
        { value: 'Wydział Lotnictwa i Kosmonautyki', label: 'WLO - Wydział Lotnictwa i Kosmonautyki' },
        { value: 'Wydział Mechaniczny', label: 'WML - Wydział Mechaniczny' },
        { value: 'Wydział Nowych Technologii i Chemii', label: 'WTC - Wydział Nowych Technologii i Chemii' },
        { value: 'Instytut Optoelektroniki', label: 'IOE - Instytut Optoelektroniki' },
    ];

    const studyLevelOptions = [
        { value: '', label: language === 'pl' ? 'Wybierz poziom' : 'Select level' },
        { value: 'I', label: language === 'pl' ? 'I - studia pierwszego stopnia' : 'I - first degree' },
        { value: 'II', label: language === 'pl' ? 'II - studia drugiego stopnia' : 'II - second degree' },
        { value: 'JM', label: language === 'pl' ? 'JM - jednolite magisterskie' : 'JM - unified master' },
        { value: 'III', label: language === 'pl' ? 'III - studia doktoranckie' : 'III - doctoral' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

            <View style={styles.tabsContainer}>
                {renderTab('general', language === 'pl' ? 'Ogólne' : 'General')}
                {user && renderTab('account', language === 'pl' ? 'Konto' : 'Account')}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {activeTab === 'general' && (
                    <>

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
                                <View style={styles.emailContainer}>
                                    <TextInput
                                        style={[styles.emailInput, { color: colors.text, backgroundColor: colors.background }]}
                                        value={accountInfo.email}
                                        onChangeText={(v) => updateAccountField('email', v)}
                                        placeholder={language === 'pl' ? 'nazwa.użytkownika' : 'username'}
                                        placeholderTextColor={colors.textSecondary}
                                        autoCapitalize="none"
                                    />
                                    <Text style={[styles.emailDomain, { color: colors.textSecondary }]}>
                                        @student.wat.edu.pl
                                    </Text>
                                </View>
                            </View>

                            {accountInfo.email && (
                                <View style={styles.inputRow}>
                                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                                        {language === 'pl' ? 'Pełny Email' : 'Full Email'}
                                    </Text>
                                    <Text style={[styles.fullEmailText, { color: colors.text }]}>
                                        {accountInfo.email}@student.wat.edu.pl
                                    </Text>
                                </View>
                            )}
                        </View>


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
                                        {studyLevelOptions.map(opt => (
                                            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        </View>


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
