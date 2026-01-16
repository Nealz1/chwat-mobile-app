import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { SpeechService } from '../services/speechService';

export interface AttachedFile {
    uri: string;
    name: string;
    mimeType?: string;
}

export function useMediaHandlers(
    setInputText: React.Dispatch<React.SetStateAction<string>>
) {
    const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);

    const handleAttachFile = useCallback(() => {
        setAttachmentModalVisible(true);
    }, []);

    const handleCameraPress = useCallback(async () => {
        setAttachmentModalVisible(false);
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Brak dostępu', 'Wymagany dostęp do aparatu');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setAttachedFile({
                uri: asset.uri,
                name: `photo_${Date.now()}.jpg`,
                mimeType: 'image/jpeg',
            });
        }
    }, []);

    const handleGalleryPress = useCallback(async () => {
        setAttachmentModalVisible(false);
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Brak dostępu', 'Wymagany dostęp do galerii');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const filename = asset.uri.split('/').pop() || `media_${Date.now()}`;
            setAttachedFile({
                uri: asset.uri,
                name: filename,
                mimeType: asset.mimeType || 'image/jpeg',
            });
        }
    }, []);

    const handleFilesPress = useCallback(async () => {
        setAttachmentModalVisible(false);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setAttachedFile(file);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Błąd', 'Nie udało się wybrać pliku');
        }
    }, []);

    const handleVoiceRecord = useCallback(async () => {
        if (isRecording && recording) {
            try {
                await recording.stopAndUnloadAsync();
                await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

                const uri = recording.getURI();
                setRecording(null);
                setIsRecording(false);

                if (uri) {
                    try {
                        const transcribedText = await SpeechService.transcribe(uri);
                        if (transcribedText) {
                            setInputText(prev => prev + (prev ? ' ' : '') + transcribedText);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } else {
                            Alert.alert('Info', 'Nie wykryto mowy');
                        }
                    } catch (transcribeError) {
                        console.error('Transcription error:', transcribeError);
                        Alert.alert('Błąd', 'Nie udało się przetworzyć nagrania');
                    }
                } else {
                    Alert.alert('Błąd', 'Nagranie nie zostało zapisane');
                }
            } catch (error) {
                console.error('Error stopping recording:', error);
                setRecording(null);
                setIsRecording(false);
                Alert.alert('Błąd', 'Nie udało się zakończyć nagrywania');
            }
        } else {
            try {
                const permission = await Audio.requestPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert('Brak dostępu', 'Wymagany dostęp do mikrofonu');
                    return;
                }

                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording: newRecording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );

                setRecording(newRecording);
                setIsRecording(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (error) {
                console.error('Error starting recording:', error);
                Alert.alert('Błąd', 'Nie udało się rozpocząć nagrywania');
            }
        }
    }, [isRecording, recording, setInputText]);

    const removeAttachment = useCallback(() => {
        setAttachedFile(null);
    }, []);

    const closeAttachmentModal = useCallback(() => {
        setAttachmentModalVisible(false);
    }, []);

    return {
        attachedFile,
        setAttachedFile,
        isRecording,
        attachmentModalVisible,
        handleAttachFile,
        handleCameraPress,
        handleGalleryPress,
        handleFilesPress,
        handleVoiceRecord,
        removeAttachment,
        closeAttachmentModal,
    };
}
