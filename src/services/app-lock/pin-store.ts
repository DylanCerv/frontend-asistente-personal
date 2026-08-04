import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const PIN_HASH_KEY = 'kivo_app_lock_pin_hash';

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export async function hasPinConfigured(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
  return Boolean(stored);
}

export async function savePin(pin: string): Promise<void> {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error('El PIN debe tener entre 4 y 6 dígitos.');
  }
  const hash = await hashPin(pin);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
  if (!stored) return false;
  const hash = await hashPin(pin);
  return hash === stored;
}

export async function clearPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_HASH_KEY);
}
