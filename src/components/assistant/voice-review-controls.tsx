import Ionicons from '@react-native-vector-icons/ionicons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  APP_ACCENT,
  APP_BORDER,
  APP_DANGER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_SURFACE_SOFT,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';

type VoiceReviewControlsProps = {
  uri: string;
  disabled?: boolean;
  onSend: () => void;
  onRepeat: () => void;
  onDelete: () => void;
  onPlayingChange?: (playing: boolean) => void;
};

function formatSeconds(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function VoiceReviewControls({
  uri,
  disabled = false,
  onSend,
  onRepeat,
  onDelete,
  onPlayingChange,
}: VoiceReviewControlsProps) {
  const player = useAudioPlayer(uri);
  const playerStatus = useAudioPlayerStatus(player);

  const durationSec = playerStatus.duration || 0;
  const currentSec = playerStatus.currentTime || 0;
  const progressRatio = durationSec > 0 ? Math.min(1, currentSec / durationSec) : 0;
  const isPlaying = playerStatus.playing;

  useEffect(() => {
    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
    player.replace(uri);
  }, [uri, player]);

  useEffect(() => {
    onPlayingChange?.(isPlaying);
    return () => onPlayingChange?.(false);
  }, [isPlaying, onPlayingChange]);

  function stopPlayback() {
    if (playerStatus.playing) player.pause();
  }

  function handlePlayPress() {
    if (disabled) return;

    if (playerStatus.playing) {
      player.pause();
      return;
    }

    void player.seekTo(currentSec >= durationSec - 0.25 ? 0 : currentSec);
    player.play();
  }

  function handleDelete() {
    if (disabled) return;
    stopPlayback();
    onDelete();
  }

  function handleRepeat() {
    if (disabled) return;
    stopPlayback();
    onRepeat();
  }

  function handleSend() {
    if (disabled) return;
    stopPlayback();
    onSend();
  }

  return (
    <View className="w-full max-w-[340px] gap-4">
      <View className="gap-2">
        <View
          className="h-1.5 overflow-hidden rounded-full"
          style={{ backgroundColor: APP_SURFACE_SOFT }}>
          <View
            className="h-full rounded-full"
            style={{
              width: `${progressRatio * 100}%`,
              backgroundColor: APP_ACCENT,
            }}
          />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-[12px]" style={{ color: APP_TEXT_MUTED }}>
            {formatSeconds(currentSec)}
          </Text>
          <Text className="text-[12px]" style={{ color: APP_TEXT_MUTED }}>
            {formatSeconds(durationSec)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playerStatus.playing ? 'Pausar' : 'Reproducir'}
          disabled={disabled}
          onPress={handlePlayPress}
          className="h-14 w-14 items-center justify-center rounded-full active:opacity-85"
          style={{
            backgroundColor: APP_ACCENT,
            opacity: disabled ? 0.55 : 1,
          }}>
          <Ionicons
            name={playerStatus.playing ? 'pause' : 'play'}
            size={26}
            color={APP_ON_ACCENT}
          />
        </Pressable>
      </View>

      <View className="flex-row items-center gap-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Eliminar audio"
          disabled={disabled}
          onPress={handleDelete}
          className="h-12 flex-1 items-center justify-center rounded-2xl border active:opacity-80"
          style={{
            backgroundColor: APP_SURFACE,
            borderColor: APP_BORDER,
            opacity: disabled ? 0.55 : 1,
          }}>
          <Ionicons name="trash-outline" size={22} color={APP_DANGER} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Grabar de nuevo"
          disabled={disabled}
          onPress={handleRepeat}
          className="h-12 flex-1 items-center justify-center rounded-2xl border active:opacity-80"
          style={{
            backgroundColor: APP_SURFACE,
            borderColor: APP_BORDER,
            opacity: disabled ? 0.55 : 1,
          }}>
          <Ionicons name="refresh-outline" size={22} color={APP_ACCENT} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar audio"
          disabled={disabled}
          onPress={handleSend}
          className="h-12 flex-1 items-center justify-center rounded-2xl active:opacity-85"
          style={{
            backgroundColor: APP_ACCENT,
            opacity: disabled ? 0.55 : 1,
          }}>
          <Ionicons name="paper-plane" size={22} color={APP_ON_ACCENT} />
        </Pressable>
      </View>
    </View>
  );
}
