import { Platform } from 'react-native';

import { apiConfig, isWhisperConfigured } from '@/config/api';

type AudioFilePart = {
  uri: string;
  name: string;
  type: string;
};

function resolveAudioFilePart(audioUri: string): AudioFilePart {
  const lowerUri = audioUri.toLowerCase();

  if (lowerUri.includes('.webm')) {
    return { uri: audioUri, name: 'recording.webm', type: 'audio/webm' };
  }

  if (lowerUri.includes('.wav')) {
    return { uri: audioUri, name: 'recording.wav', type: 'audio/wav' };
  }

  return { uri: audioUri, name: 'recording.m4a', type: 'audio/m4a' };
}

export class WhisperServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'WhisperServiceError';
  }
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  if (!isWhisperConfigured()) {
    throw new WhisperServiceError(
      'Whisper no está configurado. Agrega EXPO_PUBLIC_OPENAI_API_KEY en tu archivo .env',
    );
  }

  const filePart = resolveAudioFilePart(audioUri);
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(audioUri);
    const blob = await response.blob();
    formData.append('file', blob, filePart.name);
  } else {
    formData.append('file', filePart as unknown as Blob);
  }

  formData.append('model', apiConfig.whisperModel);
  formData.append('language', apiConfig.whisperLanguage);
  formData.append('response_format', 'json');

  const headers: Record<string, string> = {};
  if (apiConfig.openaiApiKey) {
    headers.Authorization = `Bearer ${apiConfig.openaiApiKey}`;
  }

  const response = await fetch(apiConfig.whisperApiUrl, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new WhisperServiceError(
      `Whisper falló (${response.status}): ${errorBody || response.statusText}`,
      response.status,
    );
  }

  const data = (await response.json()) as { text?: string };

  const text = data.text?.trim();
  if (!text) {
    throw new WhisperServiceError('Whisper no devolvió texto en la transcripción.');
  }

  return text;
}
