import { API_BASE_URL } from '../config/constants';

export class SpeechService {
    static async transcribe(audioUri: string): Promise<string> {
        const extension = audioUri.split('.').pop()?.toLowerCase() || 'm4a';
        const mimeTypes: Record<string, string> = {
            'm4a': 'audio/m4a',
            'mp4': 'audio/mp4',
            'wav': 'audio/wav',
            'webm': 'audio/webm',
            'caf': 'audio/x-caf',
        };
        const mimeType = mimeTypes[extension] || 'audio/m4a';

        const formData = new FormData();
        formData.append('file', {
            uri: audioUri,
            type: mimeType,
            name: `recording.${extension}`,
        } as any);

        const response = await fetch(`${API_BASE_URL}/api/speech/transcribe`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Błąd transkrypcji: ${response.status}`);
        }

        const data = await response.json();
        return data.text || '';
    }


}

export const speechService = new SpeechService();
