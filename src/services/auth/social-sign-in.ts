import * as Application from 'expo-application';
import {
  AccessTokenRequest,
  AuthRequest,
  makeRedirectUri,
  ResponseType,
} from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { getGoogleClientId, isAppleSignInSupported, isGoogleSignInConfigured } from '@/config/oauth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_SCOPES = ['openid', 'profile', 'email'];

export type AppleSignInResult = {
  idToken: string;
  nonce: string;
};

function getGoogleRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'kivo',
    native: `${Application.applicationId}:/oauthredirect`,
  });
}

export async function requestGoogleIdToken(): Promise<string> {
  if (!isGoogleSignInConfigured()) {
    throw new Error(
      'Google Sign-In no está configurado. Añade EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en tu .env.',
    );
  }

  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('No se encontró un Client ID válido para Google Sign-In.');
  }

  const redirectUri = getGoogleRedirectUri();
  const isInstalledApp = Platform.OS !== 'web';
  const responseType = isInstalledApp ? ResponseType.Code : ResponseType.IdToken;

  const request = new AuthRequest({
    clientId,
    redirectUri,
    scopes: GOOGLE_SCOPES,
    responseType,
    usePKCE: responseType === ResponseType.Code,
  });

  await request.makeAuthUrlAsync(Google.discovery);
  const result = await request.promptAsync(Google.discovery, {
    windowFeatures: { width: 515, height: 680 },
  });

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Inicio de sesión con Google cancelado.');
  }

  if (result.type !== 'success') {
    throw new Error('No se pudo iniciar sesión con Google.');
  }

  if (result.params.id_token) {
    return result.params.id_token;
  }

  if (result.params.code) {
    const exchangeRequest = new AccessTokenRequest({
      clientId,
      redirectUri,
      scopes: GOOGLE_SCOPES,
      code: result.params.code,
      extraParams: {
        code_verifier: request.codeVerifier ?? '',
      },
    });

    const authentication = await exchangeRequest.performAsync(Google.discovery);
    if (!authentication?.idToken) {
      throw new Error('No se recibió token de Google.');
    }

    return authentication.idToken;
  }

  throw new Error('No se recibió token de Google.');
}

export async function requestAppleSignIn(): Promise<AppleSignInResult> {
  if (!isAppleSignInSupported()) {
    throw new Error('Sign in with Apple solo está disponible en iOS.');
  }

  const isAvailable = await AppleAuthentication.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sign in with Apple no está disponible en este dispositivo.');
  }

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error('No se recibió token de Apple.');
    }

    return {
      idToken: credential.identityToken,
      nonce: rawNonce,
    };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ERR_REQUEST_CANCELED'
    ) {
      throw new Error('Inicio de sesión con Apple cancelado.');
    }

    throw error;
  }
}
