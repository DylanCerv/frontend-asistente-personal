import { getAccessToken } from '@/lib/auth/session-storage';
import { updateMyProfile } from './profiles-api';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const AVATARS_BUCKET = 'avatars';

/**
 * Uploads a local image URI to Supabase Storage and saves the public URL
 * in the user's profile. Returns the new public avatar URL.
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  if (!SUPABASE_URL) throw new Error('EXPO_PUBLIC_SUPABASE_URL not configured');

  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error('No access token');

  // Read the file as a Blob
  const response = await fetch(localUri);
  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';
  const ext = mimeType.split('/')[1] ?? 'jpg';

  const storagePath = `${userId}/avatar.${ext}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${AVATARS_BUCKET}/${storagePath}`;

  // Upload (upsert) to Supabase Storage
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    const err = await uploadResponse.text();
    throw new Error(`Upload failed: ${err}`);
  }

  // Build the public URL
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${AVATARS_BUCKET}/${storagePath}`;

  // Save in profile
  await updateMyProfile({ avatarUrl: publicUrl });

  return publicUrl;
}
