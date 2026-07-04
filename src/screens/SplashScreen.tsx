import Ionicons from '@react-native-vector-icons/ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Text, View } from 'react-native';

import { KivoLogo } from '@/components/kivo-logo';
import { ScreenSafeArea } from '@/components/screen-safe-area';
import { APP_NAME, APP_TAGLINE } from '@/constants/branding';

export function SplashScreen() {
  return (
    <ScreenSafeArea className="bg-[#160A2A]">
      <LinearGradient
        colors={['#160A2A', '#3B0764', '#7C3AED', '#F8F0FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.26)', 'rgba(216,180,254,0.18)', 'rgba(255,255,255,0.00)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.8 }}
        className="absolute inset-0"
      />

      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-sm items-center gap-6 rounded-[40px] border border-white/15 bg-white/10 px-6 py-8">
          <View className="rounded-[34px] bg-white/15 p-3">
            <KivoLogo size={108} />
          </View>

          <View className="items-center gap-2">
            <Text className="text-[42px] font-bold tracking-tight text-white">{APP_NAME}</Text>
            <Text className="text-center text-base font-medium leading-6 text-white/80">
              Tu asistente personal listo para organizar tu día.
            </Text>
          </View>

          <View className="w-full gap-2 rounded-[26px] bg-white/10 p-3">
            <View className="flex-row items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
              <Ionicons name="mic-outline" size={16} color="#F5D0FE" />
              <Text className="text-xs font-semibold text-white/85">Escucha tus notas</Text>
            </View>
            <View className="flex-row items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
              <Ionicons name="calendar-outline" size={16} color="#F5D0FE" />
              <Text className="text-xs font-semibold text-white/85">Organiza tareas y agenda</Text>
            </View>
          </View>

          <View className="mt-2 flex-row items-center gap-3 rounded-full bg-white/10 px-4 py-2">
            <ActivityIndicator size="small" color="#F5D0FE" />
            <Text className="text-xs font-semibold text-white/75">{APP_TAGLINE}</Text>
          </View>
        </View>
      </View>
    </ScreenSafeArea>
  );
}
