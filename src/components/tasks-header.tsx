import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { KivoWordmark } from '@/components/kivo-wordmark';
import { APP_TEXT_MUTED } from '@/constants/app-colors';
import { formatDeviceTimeZoneLabel } from '@/utils/timezone';

export function TasksHeader() {
  const [clockLabel, setClockLabel] = useState(formatDeviceTimeZoneLabel);

  useEffect(() => {
    const timer = setInterval(() => {
      setClockLabel(formatDeviceTimeZoneLabel());
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View className="px-5 pb-2 pt-1">
      <View className="flex-row items-center justify-between gap-2">
        <KivoWordmark size={22} />
        <Text className="text-[17px] font-bold text-white">Mis Tareas</Text>
      </View>
      <Text className="mt-1 text-right text-[11px] font-medium" style={{ color: APP_TEXT_MUTED }}>
        {clockLabel}
      </Text>
    </View>
  );
}
