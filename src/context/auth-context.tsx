import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type User = {
  email: string;
  name: string;
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
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USER = {
  email: 'e1@gmail.com',
  password: 'ejem1234',
  name: 'E1',
} as const;

const BOOTSTRAP_DELAY_MS = 1200;

function mockAuthDelay() {
  return new Promise<void>((resolve) => setTimeout(resolve, 600));
}

function bootstrapDelay() {
  return new Promise<void>((resolve) => setTimeout(resolve, BOOTSTRAP_DELAY_MS));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      await bootstrapDelay();

      // Mock: future session restore from secure storage goes here.
      if (isMounted) {
        setIsBootstrapping(false);
      }
    }

    validateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInCredentials) => {
    const normalizedEmail = email.trim().toLowerCase();

    setIsLoading(true);
    try {
      await mockAuthDelay();

      const isValid =
        normalizedEmail === MOCK_USER.email && password === MOCK_USER.password;

      if (!isValid) {
        throw new Error('Credenciales incorrectas');
      }

      setUser({
        email: MOCK_USER.email,
        name: MOCK_USER.name,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      await mockAuthDelay();
      setUser({
        email: 'usuario@gmail.com',
        name: 'Usuario Google',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async ({ name, email, password }: SignUpData) => {
    if (!name.trim() || !email.trim() || !password) {
      throw new Error('Completa todos los campos');
    }

    setIsLoading(true);
    try {
      await mockAuthDelay();
      setUser({
        email: email.trim(),
        name: name.trim(),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: user !== null,
      user,
      isBootstrapping,
      isLoading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
    }),
    [user, isBootstrapping, isLoading, signIn, signInWithGoogle, signUp, signOut],
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
