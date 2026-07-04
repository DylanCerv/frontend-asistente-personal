import type { UploadAudioResponse } from '@/types/audio-job';

import { apiRequest } from '../api/api-client';

export async function submitVoiceText(text: string): Promise<UploadAudioResponse> {
  return apiRequest<UploadAudioResponse>('/audio/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.trim() }),
  });
}
