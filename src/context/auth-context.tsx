import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from '@/lib/auth/session-storage';
import { setUnauthorizedHandler } from '@/services/api/api-error';
import {
  appleSignInRequest,
  getMeRequest,
  googleSignInRequest,
  loginRequest,
  refreshSessionRequest,
  registerRequest,
} from '@/services/auth/auth-api';
import { requestAppleSignIn, requestGoogleIdToken } from '@/services/auth/social-sign-in';
import { updateMyProfile } from '@/services/profiles/profiles-api';
import type { ApiUser, AuthPayload } from '@/types/api';

type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roleId: number;
  roleName: string;
};

type SignInCredentials = {
  email: string;
  password: string;
};

type SignUpData = SignInCredentials & {
  name: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  user: User | null;
  isBootstrapping: boolean;
  isLoading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  updateDisplayName: (name: string) => void;
  updateProfile: (payload: { fullName: string }) => Promise<void>;
  updateAvatar: (avatarUrl: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapApiUser(apiUser: ApiUser): User {
  const emailLocal = apiUser.email.split('@')[0] ?? 'Usuario';
  const profileName = apiUser.profile?.fullName?.trim();

  return {
    id: apiUser.id,
    email: apiUser.email,
    name: profileName || emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1),
    avatarUrl: apiUser.profile?.avatarUrl ?? null,
    roleId: apiUser.roleId,
    roleName: apiUser.role.name,
  };
}

async function persistAuth(payload: AuthPayload): Promise<User> {
  await setStoredSession(payload.session);
  return mapApiUser(payload.user);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const signOut = useCallback(() => {
    void import('@/services/reminders/device-push-token')
      .then(({ unregisterDevicePushToken }) => unregisterDevicePushToken())
      .catch(() => undefined);
    void clearStoredSession();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
  }, [signOut]);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      try {
        const storedSession = await getStoredSession();
        if (!storedSession) return;

        const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
          Promise.race([
            promise,
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Auth bootstrap timeout')), ms);
            }),
          ]);

        try {
          const apiUser = await withTimeout(getMeRequest(), 8000);
          if (isMounted) setUser(mapApiUser(apiUser));
          return;
        } catch {
          const refreshed = await withTimeout(
            refreshSessionRequest(storedSession.refreshToken),
            8000,
          );
          await setStoredSession(refreshed.session);
          if (isMounted) setUser(mapApiUser(refreshed.user));
        }
      } catch {
        await clearStoredSession();
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    }

    validateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInCredentials) => {
    setIsLoading(true);
    try {
      const payload = await loginRequest(email.trim(), password);
      const nextUser = await persistAuth(payload);
      setUser(nextUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const idToken = await requestGoogleIdToken();
      const payload = await googleSignInRequest(idToken);
      const nextUser = await persistAuth(payload);
      setUser(nextUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    setIsLoading(true);
    try {
      const { idToken, nonce } = await requestAppleSignIn();
      const payload = await appleSignInRequest(idToken, nonce);
      const nextUser = await persistAuth(payload);
      setUser(nextUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDisplayName = useCallback((name: string) => {
    setUser((prev) => (prev ? { ...prev, name: name.trim() } : prev));
  }, []);

  const updateProfile = useCallback(async (payload: { fullName: string }) => {
    const updated = await updateMyProfile({ fullName: payload.fullName });
    const profileName = updated.full_name?.trim();
    if (profileName) {
      setUser((prev) => (prev ? { ...prev, name: profileName } : prev));
    }
  }, []);

  const updateAvatar = useCallback((avatarUrl: string) => {
    setUser((prev) => (prev ? { ...prev, avatarUrl } : prev));
  }, []);

  const signUp = useCallback(async ({ name, email, password }: SignUpData) => {
    setIsLoading(true);
    try {
      const payload = await registerRequest(email.trim(), password, name.trim());
      const nextUser = await persistAuth(payload);
      setUser(nextUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: user !== null,
      user,
      isBootstrapping,
      isLoading,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signUp,
      updateDisplayName,
      updateProfile,
      updateAvatar,
      signOut,
    }),
    [
      user,
      isBootstrapping,
      isLoading,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signUp,
      updateDisplayName,
      updateProfile,
      updateAvatar,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
