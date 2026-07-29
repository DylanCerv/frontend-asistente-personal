import { Text, View } from 'react-native';

import { APP_NAME } from '@/constants/branding';
import { APP_ACCENT } from '@/constants/app-colors';

export function TasksHeader() {
  return (
    <View className="px-5 pb-2 pt-1">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-[20px] font-bold tracking-tight" style={{ color: APP_ACCENT }}>
          {APP_NAME}
        </Text>
        <Text className="text-[17px] font-bold text-white">Mis Tareas</Text>
      </View>
    </View>
  );
}
