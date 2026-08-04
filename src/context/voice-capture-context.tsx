import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type VoiceCaptureContextValue = {
  isOpen: boolean;
  autoStart: boolean;
  openCapture: (options?: { autoStart?: boolean }) => void;
  closeCapture: () => void;
};

const VoiceCaptureContext = createContext<VoiceCaptureContextValue | null>(null);

export function VoiceCaptureProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [autoStart, setAutoStart] = useState(false);

  const openCapture = useCallback((options?: { autoStart?: boolean }) => {
    setAutoStart(options?.autoStart ?? false);
    setIsOpen(true);
  }, []);

  const closeCapture = useCallback(() => {
    setIsOpen(false);
    setAutoStart(false);
  }, []);

  const value = useMemo(
    () => ({ isOpen, autoStart, openCapture, closeCapture }),
    [isOpen, autoStart, openCapture, closeCapture],
  );

  return (
    <VoiceCaptureContext.Provider value={value}>{children}</VoiceCaptureContext.Provider>
  );
}

export function useVoiceCapture() {
  const context = useContext(VoiceCaptureContext);
  if (!context) {
    throw new Error('useVoiceCapture must be used within VoiceCaptureProvider');
  }
  return context;
}
