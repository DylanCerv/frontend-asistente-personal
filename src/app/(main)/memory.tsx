import { Redirect } from 'expo-router';

/** Legacy route: Memory was removed in favor of Agenda filters. */
export default function MemoryRedirect() {
  return <Redirect href="/tasks" />;
}
