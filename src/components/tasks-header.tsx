import { Text, View } from 'react-native';

import { KivoWordmark } from '@/components/kivo-wordmark';

export function TasksHeader() {
  return (
    <View className="px-5 pb-2 pt-1">
      <View className="flex-row items-center justify-between gap-2">
        <KivoWordmark size={22} />
        <Text className="text-[17px] font-bold text-white">Mis Tareas</Text>
      </View>
    </View>
  );
}
