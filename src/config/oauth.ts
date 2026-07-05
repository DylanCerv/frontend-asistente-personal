import { Platform } from 'react-native';

type GoogleOAuthConfig = {
  webClientId: string;
  iosClientId: string;
  androidClientId: string;
};

export const GOOGLE_OAUTH: GoogleOAuthConfig = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
};

function isPlaceholderClientId(value: string): boolean {
  return !value || value.includes('your-google') || value.includes('xxx');
}

export function getGoogleClientId(): string | null {
  if (Platform.OS === 'ios' && !isPlaceholderClientId(GOOGLE_OAUTH.iosClientId)) {
    return GOOGLE_OAUTH.iosClientId;
  }

  if (Platform.OS === 'android' && !isPlaceholderClientId(GOOGLE_OAUTH.androidClientId)) {
    return GOOGLE_OAUTH.androidClientId;
  }

  if (!isPlaceholderClientId(GOOGLE_OAUTH.webClientId)) {
    return GOOGLE_OAUTH.webClientId;
  }

  return null;
}

export function isGoogleSignInConfigured(): boolean {
  return getGoogleClientId() !== null;
}

export function isAppleSignInSupported(): boolean {
  return Platform.OS === 'ios';
}
