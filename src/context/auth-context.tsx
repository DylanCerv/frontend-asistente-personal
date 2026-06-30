import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

const MOCK_USER = {
  email: 'demo@asistente.app',
  name: 'Usuario',
};

type AuthContextValue = {
  isAuthenticated: boolean;
  user: { email: string; name: string } | null;
  signIn: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  const signIn = useCallback(() => {
    setUser(MOCK_USER);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: user !== null,
      user,
      signIn,
      signOut,
    }),
    [user, signIn, signOut],
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
