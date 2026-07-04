import { API_BASE_URL } from '@/config/api';
import { LIGHT_VOICE_UPLOAD } from '@/constants/voice-recording';
import type { UploadAudioResponse } from '@/types/audio-job';

import { ApiError, handleUnauthorized } from '../api/api-error';
import { getAuthHeaders } from '../api/get-auth-headers';

/** Upload a lightweight speech clip (m4a/AAC) for server-side Whisper transcription. */
export async function uploadAudio(uri: string): Promise<UploadAudioResponse> {
  const headers = await getAuthHeaders();

  const formData = new FormData();
  formData.append('audio', {
    uri,
    name: LIGHT_VOICE_UPLOAD.fileName,
    type: LIGHT_VOICE_UPLOAD.mimeType,
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/audio`, {
    method: 'POST',
    headers: {
      ...headers,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    handleUnauthorized(response.status);
    throw new ApiError(
      (data as { error?: { message?: string } }).error?.message ?? 'Upload failed',
      response.status,
    );
  }

  return data as UploadAudioResponse;
}
