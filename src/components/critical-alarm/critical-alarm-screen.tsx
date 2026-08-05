import Ionicons from '@react-native-vector-icons/ionicons';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, Text, Vibration, View } from 'react-native';

import { SonarIcon } from '@/components/critical-alarm/sonar-icon';
import { ScreenSafeArea } from '@/components/screen-safe-area';
import {
  APP_ACCENT,
  APP_BACKGROUND,
  APP_DANGER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import { APP_NAME } from '@/constants/branding';
import { resolveAlertSoundUri } from '@/services/reminders/alert-sound-uri';
import {
  resolvePlaybackAsset,
  resolveVibrationPattern,
  type ReminderAlertSoundId,
  type ReminderAlertVibrationId,
} from '@/services/reminders/reminder-alert-presets';
import {
  shouldPlaySound,
  shouldVibrate,
  type ReminderAlertStyle,
} from '@/services/reminders/reminder-alert-style';

const ORANGE_DOT = '#F59E0B';
const DANGER_SOFT = 'rgba(248, 113, 113, 0.16)';
const DANGER_BORDER = 'rgba(248, 113, 113, 0.45)';
const SURFACE_PILL = '#141414';

type CriticalAlarmScreenProps = {
  title: string;
  alertStyle: ReminderAlertStyle;
  soundId?: ReminderAlertSoundId;
  vibrationId?: ReminderAlertVibrationId;
  onComplete: () => void;
  onSnooze: () => void;
  onTalk: () => void;
};

export function CriticalAlarmScreen({
  title,
  alertStyle,
  soundId = 'system',
  vibrationId = 'standard',
  onComplete,
  onSnooze,
  onTalk,
}: CriticalAlarmScreenProps) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const stoppedRef = useRef(false);

  const stopAlerts = useCallback(() => {
    stoppedRef.current = true;
    Vibration.cancel();
    try {
      playerRef.current?.pause();
      playerRef.current?.remove();
    } catch {
      // Player already released.
    }
    playerRef.current = null;
  }, []);

  useEffect(() => {
    stoppedRef.current = false;
    const playSound = shouldPlaySound(alertStyle, 'alarm');
    const vibrate = shouldVibrate(alertStyle);

    async function startAlerts() {
      if (vibrate) {
        Vibration.vibrate(resolveVibrationPattern(vibrationId, true), true);
      }

      if (!playSound) return;

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: true,
        });

        const uri =
          soundId === 'custom' || soundId === 'system'
            ? await resolveAlertSoundUri(soundId)
            : null;
        const bundled = soundId === 'kivo_clear' ? resolvePlaybackAsset(soundId) : null;
        if (!uri && !bundled) return;

        const player = createAudioPlayer(uri ? { uri } : bundled!);
        player.loop = true;
        playerRef.current = player;
        player.play();
      } catch {
        // Sound is best-effort; vibration still runs.
      }
    }

    void startAlerts();

    return () => {
      stopAlerts();
    };
  }, [alertStyle, soundId, stopAlerts, vibrationId]);

  function handleComplete() {
    stopAlerts();
    onComplete();
  }

  function handleSnooze() {
    stopAlerts();
    onSnooze();
  }

  function handleTalk() {
    stopAlerts();
    onTalk();
  }

  return (
    <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND }}>
      <LinearGradient
        colors={['rgba(196,181,253,0.18)', 'transparent', 'rgba(196,181,253,0.08)']}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <ScreenSafeArea edges={['top', 'bottom']}>
        <View className="flex-1 px-6 pb-4 pt-3">
          <View className="flex-row items-center gap-2.5">
            <Text className="text-[22px] font-bold tracking-tight" style={{ color: APP_ACCENT }}>
              {APP_NAME}
            </Text>
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: ORANGE_DOT }} />
            <Text
              className="text-[11px] font-bold uppercase tracking-[1.6px] text-white"
              style={{ letterSpacing: 1.6 }}>
              Alarma crítica
            </Text>
          </View>

          <View className="flex-1 items-center justify-center">
            <SonarIcon active size={200} color={APP_ACCENT} />
          </View>

          <View className="items-center gap-4 pb-2">
            <Text className="px-2 text-center text-[28px] font-bold leading-9 text-white">
              {title}
            </Text>

            <View
              className="flex-row items-center gap-2 rounded-full border px-3.5 py-2"
              style={{ backgroundColor: DANGER_SOFT, borderColor: DANGER_BORDER }}>
              <Ionicons name="time-outline" size={14} color="#FFFFFF" />
              <Text className="text-[11px] font-bold uppercase tracking-[1.2px] text-white">
                Vence ahora.
              </Text>
            </View>
          </View>

          <View className="mt-8 gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ya lo hago"
              onPress={handleComplete}
              className="min-h-[58px] flex-row items-center justify-center gap-2.5 rounded-full active:opacity-90"
              style={{ backgroundColor: APP_ACCENT }}>
              <Text className="text-[17px] font-bold" style={{ color: APP_ON_ACCENT }}>
                Ya lo hago
              </Text>
              <Ionicons name="paper-plane" size={18} color={APP_ON_ACCENT} />
            </Pressable>

            <View className="flex-row gap-2.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Posponer 5 minutos"
                onPress={handleSnooze}
                className="min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-full border active:opacity-85"
                style={{ backgroundColor: SURFACE_PILL, borderColor: 'rgba(255,255,255,0.08)' }}>
                <Ionicons name="alarm-outline" size={18} color={APP_TEXT_MUTED} />
                <Text className="text-[13px] font-semibold text-white">Posponer 5 min</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hablar con Kivo"
                onPress={handleTalk}
                className="min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-full border active:opacity-85"
                style={{
                  backgroundColor: APP_SURFACE,
                  borderColor: 'rgba(255,255,255,0.08)',
                }}>
                <Ionicons name="mic-outline" size={18} color={APP_TEXT_MUTED} />
                <Text className="text-[13px] font-semibold text-white">Hablar con Kivo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScreenSafeArea>
    </View>
  );
}
