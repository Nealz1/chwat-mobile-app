import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../config/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'CanteenForm'>;

const CANTEENS = [
    { id: '1', name: 'Stołówka SW1' },
    { id: '2', name: 'Stołówka SW2' },
    { id: '3', name: 'Stołówka SW3' },
    { id: '4', name: 'Stołówka SW4' },
    { id: '5', name: 'Stołówka SW5' },
];

export function CanteenFormScreen({ navigation }: Props) {
    const { colors } = useTheme();
    const { language } = useLanguage();
    const isPl = language === 'pl';

    const [selectedCanteen, setSelectedCanteen] = useState<string | null>(null);
    const [menuDate, setMenuDate] = useState<Date>(new Date());
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert(
                isPl ? 'Brak uprawnień' : 'Permission Required',
                isPl ? 'Potrzebujemy dostępu do galerii' : 'We need gallery access'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setUploadSuccess(false);
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert(
                isPl ? 'Brak uprawnień' : 'Permission Required',
                isPl ? 'Potrzebujemy dostępu do kamery' : 'We need camera access'
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setUploadSuccess(false);
        }
    };

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (days: number) => {
        const newDate = new Date(menuDate);
        newDate.setDate(newDate.getDate() + days);
        setMenuDate(newDate);
    };

    const handleUpload = async () => {
        if (!selectedCanteen) {
            Alert.alert(
                isPl ? 'Błąd' : 'Error',
                isPl ? 'Wybierz stołówkę' : 'Please select a canteen'
            );
            return;
        }

        if (!imageUri) {
            Alert.alert(
                isPl ? 'Błąd' : 'Error',
                isPl ? 'Wybierz zdjęcie menu' : 'Please select a menu image'
            );
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('canteen_number', selectedCanteen);
            formData.append('menu_date', formatDate(menuDate));

            const imageFile = {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'menu.jpg',
            } as any;
            formData.append('image', imageFile);

            const response = await fetch(`${API_BASE_URL}/canteen/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.ok) {
                setUploadSuccess(true);
                Alert.alert(
                    '✅',
                    isPl
                        ? 'Zdjęcie wysłane! Menu zostanie przetworzone przez AI w tle.'
                        : 'Image sent! Menu will be processed by AI in the background.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert(
                isPl ? 'Błąd' : 'Error',
                isPl ? 'Nie udało się wysłać zdjęcia' : 'Failed to upload image'
            );
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {isPl ? '📸 Dodaj Menu Stołówki' : '📸 Add Canteen Menu'}
                </Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {isPl
                        ? 'Zrób zdjęcie tablicy z menu lub wybierz z galerii'
                        : 'Take a photo of the menu board or select from gallery'}
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {isPl ? '1. Wybierz stołówkę:' : '1. Select canteen:'}
                </Text>

                <View style={styles.canteenList}>
                    {CANTEENS.map((canteen) => (
                        <TouchableOpacity
                            key={canteen.id}
                            style={[
                                styles.canteenItem,
                                {
                                    backgroundColor: selectedCanteen === canteen.id
                                        ? colors.primary
                                        : colors.surface,
                                    borderColor: colors.border,
                                }
                            ]}
                            onPress={() => setSelectedCanteen(canteen.id)}
                        >
                            <Text style={[
                                styles.canteenText,
                                { color: selectedCanteen === canteen.id ? '#fff' : colors.text }
                            ]}>
                                {canteen.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {isPl ? '2. Data menu:' : '2. Menu date:'}
                </Text>

                <View style={styles.dateSelector}>
                    <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: colors.surface }]}
                        onPress={() => handleDateChange(-1)}
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <View style={[styles.dateDisplay, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.dateText, { color: colors.text }]}>
                            {formatDate(menuDate)}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: colors.surface }]}
                        onPress={() => handleDateChange(1)}
                    >
                        <Ionicons name="chevron-forward" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {isPl ? '3. Zdjęcie menu:' : '3. Menu photo:'}
                </Text>

                <View style={styles.imageButtons}>
                    <TouchableOpacity
                        style={[styles.imageButton, { backgroundColor: colors.primary }]}
                        onPress={takePhoto}
                    >
                        <Ionicons name="camera" size={24} color="#fff" />
                        <Text style={styles.imageButtonText}>
                            {isPl ? 'Aparat' : 'Camera'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.imageButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                        onPress={pickImage}
                    >
                        <Ionicons name="images" size={24} color={colors.text} />
                        <Text style={[styles.imageButtonText, { color: colors.text }]}>
                            {isPl ? 'Galeria' : 'Gallery'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {imageUri && (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        <TouchableOpacity
                            style={styles.removeImage}
                            onPress={() => setImageUri(null)}
                        >
                            <Ionicons name="close-circle" size={28} color="#e74c3c" />
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.uploadButton,
                        {
                            backgroundColor: (selectedCanteen && imageUri)
                                ? colors.primary
                                : colors.border,
                            opacity: uploading ? 0.7 : 1,
                        }
                    ]}
                    onPress={handleUpload}
                    disabled={uploading || !selectedCanteen || !imageUri}
                >
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="cloud-upload" size={24} color="#fff" />
                            <Text style={styles.uploadButtonText}>
                                {isPl ? 'Wyślij Menu' : 'Upload Menu'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {uploadSuccess && (
                    <View style={[styles.successBanner, { backgroundColor: '#27ae60' }]}>
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        <Text style={styles.successText}>
                            {isPl ? 'Menu wysłane pomyślnie!' : 'Menu uploaded successfully!'}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 8,
    },
    canteenList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    canteenItem: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    canteenText: {
        fontSize: 14,
        fontWeight: '500',
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16,
    },
    dateButton: {
        padding: 12,
        borderRadius: 10,
    },
    dateDisplay: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    dateText: {
        fontSize: 18,
        fontWeight: '600',
    },
    imageButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    imageButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    imageButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    previewContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        resizeMode: 'cover',
    },
    removeImage: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    uploadButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 16,
    },
    successText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
