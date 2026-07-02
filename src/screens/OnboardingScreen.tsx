import Ionicons from '@react-native-vector-icons/ionicons';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'mic-outline' as const,
    title: 'Habla naturalmente',
    description: 'No escribas listas. Solo di lo que necesitas recordar, como si hablaras con una persona.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'La IA organiza todo',
    description: 'Eventos, tareas, recordatorios y notas. Todo clasificado automáticamente sin que elijas carpetas.',
  },
  {
    icon: 'notifications-outline' as const,
    title: 'Nunca olvides nada importante',
    description: 'Recordatorios inteligentes que te avisan a tiempo, no solo a la hora exacta.',
  },
] as const;

type OnboardingScreenProps = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const isLast = currentIndex === SLIDES.length - 1;

  function handleNext() {
    if (isLast) {
      onComplete();
      return;
    }

    const nextIndex = currentIndex + 1;
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setCurrentIndex(nextIndex);
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
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

          <Button label={isLast ? 'Comenzar' : 'Siguiente'} onPress={handleNext} />

          {!isLast ? (
            <Pressable accessibilityRole="button" onPress={onComplete} className="items-center py-2">
              <Text className="text-sm text-subtle dark:text-subtle-dark">Saltar</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
