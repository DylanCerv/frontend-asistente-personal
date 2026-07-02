import Ionicons from '@react-native-vector-icons/ionicons';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import { useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Pressable, Text, View } from 'react-native';
import { ScreenSafeArea } from '@/components/screen-safe-area';

import { Button } from '@/components/ui/button';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'mic-outline' as const,
    title: 'Habla naturalmente',
    description:
      'No escribas listas. Solo di lo que necesitas recordar, como si hablaras con una persona.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'La IA organiza todo',
    description:
      'Eventos, tareas, recordatorios y notas. Todo clasificado automáticamente sin que elijas carpetas.',
  },
  {
    icon: 'notifications-outline' as const,
    title: 'Nunca olvides nada importante',
    description:
      'Recordatorios inteligentes que te avisan a tiempo, no solo a la hora exacta.',
  },
] as const;

type OnboardingPhase = 'slides' | 'permissions';

export type OnboardingCompleteOptions = {
  notificationsEnabled: boolean;
};

type OnboardingScreenProps = {
  userName?: string;
  onComplete: (options: OnboardingCompleteOptions) => void | Promise<void>;
};

export function OnboardingScreen({ userName, onComplete }: OnboardingScreenProps) {
  const [phase, setPhase] = useState<OnboardingPhase>('slides');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [micGranted, setMicGranted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const listRef = useRef<FlatList>(null);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  async function requestMicPermission() {
    const result = await requestRecordingPermissionsAsync();
    if (result.granted) {
      setMicGranted(true);
      return;
    }
    Alert.alert('Permiso requerido', 'El micrófono es esencial para usar el asistente por voz.');
  }

  function handleSlideNext() {
    if (isLastSlide) {
      setPhase('permissions');
      return;
    }

    const nextIndex = currentIndex + 1;
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setCurrentIndex(nextIndex);
  }

  async function handleFinish() {
    if (!micGranted) {
      Alert.alert('Micrófono requerido', 'Activa el permiso de micrófono para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete({ notificationsEnabled });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (phase === 'permissions') {
    return (
      <ScreenSafeArea>
        <View className="flex-1 justify-center px-6">
          <View className="w-full max-w-md gap-8 self-center">
            <View className="items-center gap-3">
              <View className="h-16 w-16 items-center justify-center rounded-3xl bg-muted dark:bg-muted-dark">
                <Ionicons name="shield-checkmark-outline" size={32} color="#7C3AED" />
              </View>
              <Text className="text-center text-[26px] font-bold text-foreground dark:text-foreground-dark">
                {userName ? `¡Hola, ${userName}!` : 'Último paso'}
              </Text>
              <Text className="text-center text-base text-subtle dark:text-subtle-dark">
                Activa los permisos para que tu asistente funcione desde el primer día.
              </Text>
            </View>

            <View className="gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={requestMicPermission}
                className={`flex-row items-center gap-4 rounded-2xl border p-4 active:opacity-80 ${
                  micGranted
                    ? 'border-brand bg-surface-soft dark:border-brand-dark dark:bg-surface-soft-dark'
                    : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
                }`}>
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                  <Ionicons name="mic-outline" size={22} color={micGranted ? '#7C3AED' : '#6B6475'} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-[15px] font-semibold text-foreground dark:text-foreground-dark">
                    Micrófono
                  </Text>
                  <Text className="text-xs text-subtle dark:text-subtle-dark">
                    Para capturar tus ideas por voz
                  </Text>
                </View>
                <Ionicons
                  name={micGranted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={micGranted ? '#7C3AED' : '#6B6475'}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => setNotificationsEnabled((prev) => !prev)}
                className={`flex-row items-center gap-4 rounded-2xl border p-4 active:opacity-80 ${
                  notificationsEnabled
                    ? 'border-brand bg-surface-soft dark:border-brand-dark dark:bg-surface-soft-dark'
                    : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
                }`}>
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-muted dark:bg-muted-dark">
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={notificationsEnabled ? '#7C3AED' : '#6B6475'}
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-[15px] font-semibold text-foreground dark:text-foreground-dark">
                    Notificaciones
                  </Text>
                  <Text className="text-xs text-subtle dark:text-subtle-dark">
                    Para recordarte a tiempo
                  </Text>
                </View>
                <Ionicons
                  name={notificationsEnabled ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={notificationsEnabled ? '#7C3AED' : '#6B6475'}
                />
              </Pressable>
            </View>

            <Button
              label="Empezar a usar el asistente"
              onPress={handleFinish}
              disabled={!micGranted || isSubmitting}
              loading={isSubmitting}
            />
          </View>
        </View>
      </ScreenSafeArea>
    );
  }

  return (
    <ScreenSafeArea>
      <View className="flex-1">
        <View className="items-center gap-2 px-6 pt-8">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-muted dark:bg-muted-dark">
            <Ionicons name="sparkles-outline" size={28} color="#7C3AED" />
          </View>
          <Text className="text-sm font-medium text-brand dark:text-brand-dark">
            Habla. Nosotros organizamos.
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          renderItem={({ item }) => (
            <View style={{ width }} className="flex-1 items-center justify-center gap-6 px-10">
              <View className="h-28 w-28 items-center justify-center rounded-[36px] bg-muted dark:bg-muted-dark">
                <Ionicons name={item.icon} size={52} color="#7C3AED" />
              </View>
              <Text className="text-center text-[28px] font-bold text-foreground dark:text-foreground-dark">
                {item.title}
              </Text>
              <Text className="text-center text-base leading-7 text-subtle dark:text-subtle-dark">
                {item.description}
              </Text>
            </View>
          )}
        />

        <View className="gap-6 px-6 pb-8">
          <View className="flex-row items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <View
                key={i}
                className={`h-2 rounded-full ${
                  i === currentIndex ? 'w-6 bg-brand dark:bg-brand-dark' : 'w-2 bg-border dark:bg-border-dark'
                }`}
              />
            ))}
          </View>

          <Button label={isLastSlide ? 'Continuar' : 'Siguiente'} onPress={handleSlideNext} />

          {!isLastSlide ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setPhase('permissions')}
              className="items-center py-2">
              <Text className="text-sm text-subtle dark:text-subtle-dark">Saltar</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScreenSafeArea>
  );
}
