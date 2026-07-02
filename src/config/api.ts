import Constants from 'expo-constants';

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:3000/api';

export const POLL_INTERVAL_MS = 2500;
export const MAX_POLL_DURATION_MS = 120_000;
