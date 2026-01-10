import { API_BASE_URL } from '../config/constants';

export class SpeechService {
    /**
     * Transcribe audio file to text using backend API
     * @param audioUri - Local file URI of the recorded audio
     * @returns Transcribed text
     */
    static async transcribe(audioUri: string): Promise<string> {
        // Determine file type from extension
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

    /**
     * Synthesize text to speech using backend API
     */
    static async synthesize(text: string, voice: string = 'alloy'): Promise<string> {
        const response = await fetch(`${API_BASE_URL}/api/speech/synthesize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, voice }),
        });

        if (!response.ok) {
            throw new Error('Failed to synthesize speech');
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }
}

export const speechService = new SpeechService();
