import { API_BASE_URL } from '@/config/api';
import type { UploadAudioResponse } from '@/types/audio-job';

import { ApiError, handleUnauthorized } from '../api/api-error';
import { getAuthHeaders } from '../api/get-auth-headers';

export async function uploadAudio(uri: string): Promise<UploadAudioResponse> {
  const headers = await getAuthHeaders();

  const formData = new FormData();
  formData.append('audio', {
    uri,
    name: 'recording.m4a',
    type: 'audio/m4a',
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
