import Ionicons from '@react-native-vector-icons/ionicons';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState, type ComponentProps } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLockDelayPicker } from '@/components/app-lock-delay-picker';
import { AppLockMethodPicker } from '@/components/app-lock-method-picker';
import {
  OnboardingFeatureCard,
  OnboardingVoiceVisual,
} from '@/components/onboarding/onboarding-voice-visual';
import { OnboardingPrioritiesVisual } from '@/components/onboarding/onboarding-priorities-visual';
import { KivoLogo } from '@/components/kivo-logo';
import { ScreenSafeArea } from '@/components/screen-safe-area';
import {
  APP_ACCENT,
  APP_BACKGROUND,
  APP_BORDER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_SURFACE_SOFT,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import { APP_NAME } from '@/constants/branding';
import type { AppLockDelaySeconds, AppLockMethod } from '@/context/user-preferences-context';
import { showAppAlert } from '@/services/app-dialog';
import { DEFAULT_APP_LOCK_DELAY_SECONDS } from '@/services/app-lock/lock-delay';
import { isAndroidWidgetSupported, isIosWidgetSupported } from '@/services/widgets/widget-storage';

const { width } = Dimensions.get('window');

type SlideKind = 'voice' | 'priorities' | 'permissions';

type Slide = {
  kind: SlideKind;
  title: string;
  titleAccent?: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    kind: 'voice',
    title: 'Interactúa con tu voz',
    description:
      'Kivo entiende el lenguaje natural. Solo tienes que hablar para añadir tareas, programar eventos o pedir resúmenes de tu agenda.',
  },
  {
    kind: 'priorities',
    title: 'Prioridades',
    titleAccent: 'Inteligentes',
    description:
      'Kivo analiza tus tareas y resalta lo que realmente importa ahora mismo.',
  },
  {
    kind: 'permissions',
    title: 'Último paso',
    description: 'Activa los permisos para que Kivo funcione desde el primer día.',
  },
];

export type OnboardingCompleteOptions = {
  notificationsEnabled: boolean;
  appLockMethod: AppLockMethod;
  appLockDelaySeconds: AppLockDelaySeconds;
  homeWidgetEnabled: boolean;
};

type OnboardingScreenProps = {
  userName?: string;
  onComplete: (options: OnboardingCompleteOptions) => void | Promise<void>;
};

export function OnboardingScreen({ userName, onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [micGranted, setMicGranted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [appLockMethod, setAppLockMethod] = useState<AppLockMethod>('none');
  const [appLockDelaySeconds, setAppLockDelaySeconds] = useState<AppLockDelaySeconds>(
    DEFAULT_APP_LOCK_DELAY_SECONDS,
  );
  const [homeWidgetEnabled, setHomeWidgetEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const listRef = useRef<FlatList<Slide>>(null);

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const permissionsIndex = SLIDES.findIndex((slide) => slide.kind === 'permissions');

  async function requestMicPermission() {
    const result = await requestRecordingPermissionsAsync();
    if (result.granted) {
      setMicGranted(true);
      return;
    }
    showAppAlert('Permiso requerido', 'El micrófono es esencial para usar Kivo por voz.');
  }

  function goToSlide(index: number) {
    const clamped = Math.max(0, Math.min(index, SLIDES.length - 1));
    listRef.current?.scrollToIndex({ index: clamped, animated: true });
    setCurrentIndex(clamped);
  }

  function handleSlideNext() {
    if (isLastSlide) {
      void handleFinish();
      return;
    }
    goToSlide(currentIndex + 1);
  }

  function handleSkip() {
    goToSlide(permissionsIndex);
  }

  async function handleFinish() {
    if (!micGranted) {
      showAppAlert('Micrófono requerido', 'Activa el permiso de micrófono para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete({
        notificationsEnabled,
        appLockMethod,
        appLockDelaySeconds,
        homeWidgetEnabled,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderSlide({ item }: ListRenderItemInfo<Slide>) {
    if (item.kind === 'voice') {
      return (
        <ScrollView
          style={{ width }}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow justify-center px-6 pb-4 pt-2">
          <OnboardingVoiceVisual />

          <Text className="mb-3 text-center text-[28px] font-bold tracking-tight text-white">
            {item.title}
          </Text>
          <Text className="mb-6 text-center text-[15px] leading-6 text-white/70">
            {item.description}
          </Text>

          <View className="flex-row gap-3">
            <OnboardingFeatureCard
              icon="speedometer-outline"
              iconColor={APP_ACCENT}
              title="Ultra Rápido"
              description="Procesamiento instantáneo de comandos complejos."
            />
            <OnboardingFeatureCard
              icon="sparkles"
              iconColor="#2DD4BF"
              title="IA Contextual"
              description="Aprende de tus prioridades y tonos preferidos."
            />
          </View>
        </ScrollView>
      );
    }

    if (item.kind === 'priorities') {
      return (
        <ScrollView
          style={{ width }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 22,
            paddingTop: 8,
            paddingBottom: 12,
          }}>
          <Text
            style={{
              marginBottom: 8,
              color: '#FFFFFF',
              fontSize: 30,
              fontWeight: '700',
              letterSpacing: -0.5,
              textAlign: 'center',
            }}>
            {item.title}{' '}
            <Text style={{ color: '#2DD4BF' }}>{item.titleAccent}</Text>
          </Text>
          <Text
            style={{
              marginBottom: 22,
              alignSelf: 'center',
              maxWidth: 320,
              color: 'rgba(255,255,255,0.62)',
              fontSize: 14,
              lineHeight: 21,
              textAlign: 'center',
            }}>
            {item.description}
          </Text>

          <OnboardingPrioritiesVisual />
        </ScrollView>
      );
    }

    if (item.kind === 'permissions') {
      const heading = userName ? `¡Hola, ${userName}!` : item.title;

      return (
        <ScrollView
          style={{ width }}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow px-5 pb-4 pt-2">
          <View className="w-full gap-6">
            <View className="items-center gap-3">
              <View
                className="rounded-[26px] border border-[#2A2A35] p-2"
                style={{ backgroundColor: APP_SURFACE }}>
                <KivoLogo size={56} color={APP_ACCENT} foldColor="#A78BFA" />
              </View>
              <Text className="text-center text-[26px] font-bold text-white">{heading}</Text>
              <Text className="text-center text-base text-[#8A8A8A]">{item.description}</Text>
            </View>

            <View className="w-full gap-4">
              <PermissionRow
                active={micGranted}
                icon="mic-outline"
                title="Micrófono"
                subtitle="Para capturar tus ideas por voz"
                onPress={requestMicPermission}
              />
              <PermissionRow
                active={notificationsEnabled}
                icon="notifications-outline"
                title="Notificaciones"
                subtitle="Para recordarte a tiempo"
                onPress={() => setNotificationsEnabled((prev) => !prev)}
              />

              <AppLockMethodPicker
                value={appLockMethod}
                onChange={setAppLockMethod}
                includeNone
              />

              {appLockMethod !== 'none' ? (
                <AppLockDelayPicker
                  value={appLockDelaySeconds}
                  onChange={setAppLockDelaySeconds}
                />
              ) : null}

              <PermissionRow
                active={homeWidgetEnabled}
                icon="grid-outline"
                title="Widgets de inicio"
                subtitle={
                  isAndroidWidgetSupported() || isIosWidgetSupported()
                    ? 'Agenda, prioridad y captura rápida en modo oscuro'
                    : 'Disponible en iPhone y Android con build nativo'
                }
                onPress={() => setHomeWidgetEnabled((prev) => !prev)}
              />
            </View>
          </View>
        </ScrollView>
      );
    }

    return null;
  }

  return (
    <ScreenSafeArea edges={['bottom']} className="bg-[#050505]">
      <StatusBar style="light" />
      <View className="flex-1" style={{ paddingTop: insets.top + 8, backgroundColor: APP_BACKGROUND }}>
        <View className="mb-2 flex-row items-center justify-between px-6">
          <Text
            className="text-[22px] font-bold tracking-tight"
            style={{
              color: APP_ACCENT,
              textShadowColor: 'rgba(196, 181, 253, 0.35)',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 12,
            }}>
            {APP_NAME}
          </Text>
          {!isLastSlide ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleSkip}
              hitSlop={10}
              className="active:opacity-70">
              <Text className="text-[13px] font-semibold tracking-[1.2px] text-white">SALTAR</Text>
            </Pressable>
          ) : (
            <View className="w-14" />
          )}
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.kind}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          renderItem={renderSlide}
        />

        <View className="gap-5 px-6 pb-6">
          <View className="flex-row items-center justify-center gap-2">
            {SLIDES.map((slide, i) => (
              <View
                key={slide.kind}
                style={{
                  height: 4,
                  width: i === currentIndex ? 28 : 14,
                  borderRadius: 999,
                  backgroundColor: i === currentIndex ? APP_ACCENT : APP_BORDER,
                  shadowColor: i === currentIndex ? APP_ACCENT : 'transparent',
                  shadowOpacity: i === currentIndex ? 0.7 : 0,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 0 },
                }}
              />
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isLastSlide && (!micGranted || isSubmitting)}
            onPress={handleSlideNext}
            className={`min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl px-5 active:opacity-90 ${
              isLastSlide && (!micGranted || isSubmitting) ? 'opacity-50' : ''
            }`}
            style={{ backgroundColor: APP_ACCENT }}>
            <Text className="text-[15px] font-bold" style={{ color: APP_ON_ACCENT }}>
              {isLastSlide ? 'Empezar a usar Kivo' : 'Siguiente'}
            </Text>
            <Ionicons
              name={isLastSlide ? 'arrow-forward' : 'chevron-forward'}
              size={18}
              color={APP_ON_ACCENT}
            />
          </Pressable>

          {isLastSlide ? (
            <Text className="text-center text-[11px] text-[#6B6B6B]">
              Al finalizar, entrarás a tu panel de control personalizado.
            </Text>
          ) : null}
        </View>
      </View>
    </ScreenSafeArea>
  );
}

function PermissionRow({
  active,
  icon,
  title,
  subtitle,
  onPress,
}: {
  active: boolean;
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-2xl border p-4 active:opacity-80"
      style={{
        borderColor: active ? APP_ACCENT : APP_BORDER,
        backgroundColor: active ? '#1A1528' : APP_SURFACE,
      }}>
      <View
        className="h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: APP_SURFACE_SOFT }}>
        <Ionicons name={icon} size={22} color={active ? APP_ACCENT : APP_TEXT_MUTED} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-[15px] font-semibold text-white">{title}</Text>
        <Text className="text-xs leading-5 text-[#8A8A8A]">{subtitle}</Text>
      </View>
      <Ionicons
        name={active ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={active ? APP_ACCENT : APP_TEXT_MUTED}
      />
    </Pressable>
  );
}
