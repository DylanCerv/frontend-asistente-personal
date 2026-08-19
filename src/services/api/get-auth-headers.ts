import { getAccessToken } from '@/lib/auth/session-storage';
import { getDeviceTimeZone } from '@/utils/timezone';

import { ApiError } from './api-error';

export async function getAuthHeaders(): Promise<HeadersInit> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new ApiError('User not authenticated', 401);
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    'X-Timezone': getDeviceTimeZone(),
  };
}
