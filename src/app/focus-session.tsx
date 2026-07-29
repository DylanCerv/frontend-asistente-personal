import { Redirect } from 'expo-router';

/**
 * Deep link from Focus notification. Session UI is hosted inside (main)
 * via FocusSessionProvider + FocusSessionHost after hydration.
 */
export default function FocusSessionRoute() {
  return <Redirect href="/(main)" />;
}
