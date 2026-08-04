import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const RECOVERY_SESSION_KEY = 'kivo_pin_recovery_session';
const RECOVERY_TTL_MS = 15 * 60 * 1000;

type RecoverySession = {
  userId: string;
  token: string;
  expiresAt: number;
};

async function hashToken(token: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token);
}

export async function startPinRecoverySession(userId: string): Promise<string> {
  const token = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const session: RecoverySession = {
    userId,
    token: await hashToken(token),
    expiresAt: Date.now() + RECOVERY_TTL_MS,
  };
  await SecureStore.setItemAsync(RECOVERY_SESSION_KEY, JSON.stringify(session));
  return token;
}

export async function isPinRecoverySessionValid(userId: string, token: string): Promise<boolean> {
  const raw = await SecureStore.getItemAsync(RECOVERY_SESSION_KEY);
  if (!raw) return false;

  try {
    const session = JSON.parse(raw) as RecoverySession;
    if (session.userId !== userId) return false;
    if (session.expiresAt < Date.now()) {
      await clearPinRecoverySession();
      return false;
    }
    const tokenHash = await hashToken(token);
    return tokenHash === session.token;
  } catch {
    return false;
  }
}

export async function clearPinRecoverySession(): Promise<void> {
  await SecureStore.deleteItemAsync(RECOVERY_SESSION_KEY);
}
