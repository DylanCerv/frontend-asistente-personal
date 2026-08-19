import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Wall-clock tick so countdowns stay fresh without a manual refresh. */
export function useTickingNow(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, intervalMs);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [intervalMs]);

  return now;
}
