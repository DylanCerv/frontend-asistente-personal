import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AuthErrorBannerProps = {
  message: string;
};

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  return (
    <View className="flex-row items-start gap-3 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 dark:border-danger-dark/30 dark:bg-danger-dark/10">
      <Ionicons name="alert-circle" size={20} color="#DC2626" style={{ marginTop: 1 }} />
      <Text className="flex-1 text-sm leading-5 text-danger dark:text-danger-dark">{message}</Text>
    </View>
  );
}
