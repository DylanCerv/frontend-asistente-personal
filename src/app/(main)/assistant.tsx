import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { VoiceReviewControls } from '@/components/assistant/voice-review-controls';
import { VoiceWaveform } from '@/components/assistant/voice-waveform';
import { KeyboardIcon } from '@/components/icons/keyboard-icon';
import { ScreenSafeArea } from '@/components/screen-safe-area';
import {
  APP_ACCENT,
  APP_BORDER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_SURFACE_SOFT,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import { APP_NAME } from '@/constants/branding';
import { pickVoiceExamples, type VoiceExample } from '@/constants/voice-examples';
import { useAssistant } from '@/context/assistant-context';
import { useAuth } from '@/context/auth-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';

export default function AssistantScreen() {
  const router = useRouter();
  const { autoRecord } = useLocalSearchParams<{ autoRecord?: string }>();
  const { user } = useAuth();
  const { autoSendVoice } = useUserPreferences();
  const { sendTextMessage, sendVoiceMessage, isProcessing, processingStep } = useAssistant();
  const { isRecording, hasRecording, uri, error, startRecording, stopRecording, reset } =
    useVoiceRecorder();

  const [input, setInput] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isPlayingReview, setIsPlayingReview] = useState(false);
  const [examples, setExamples] = useState<VoiceExample[]>(() => pickVoiceExamples());
  const isAutoStartingRef = useRef(false);
  const autoSendInFlightUriRef = useRef<string | null>(null);

  const canSendText = input.trim().length > 0 && !isProcessing && !isRecording && !hasRecording;
  const isListening = isRecording;
  const showBusy = isProcessing && !isListening;
  const showReview = hasRecording && !!uri && !isProcessing && !autoSendVoice;

  useFocusEffect(
    useCallback(() => {
      setExamples(pickVoiceExamples());
    }, []),
  );

  useEffect(() => {
    if (error) setStatusError(error);
  }, [error]);

  useEffect(() => {
    if (!autoSendVoice || !hasRecording || !uri || isProcessing || isRecording) return;
    if (autoSendInFlightUriRef.current === uri) return;

    autoSendInFlightUriRef.current = uri;
    setStatusError(null);

    void sendVoiceMessage(uri)
      .catch(() => {
        setStatusError('No se pudo procesar el audio. Intenta de nuevo.');
      })
      .finally(() => {
        if (autoSendInFlightUriRef.current === uri) {
          autoSendInFlightUriRef.current = null;
        }
        reset();
      });
  }, [autoSendVoice, hasRecording, uri, isProcessing, isRecording, sendVoiceMessage, reset]);

  useEffect(() => {
    if (autoRecord !== '1') return;

    // Always consume the param so it never retriggers later.
    router.setParams({ autoRecord: undefined });

    // Keep pending/in-progress audio; just land on Assistant.
    if (isAutoStartingRef.current || isProcessing || isRecording || hasRecording) {
      return;
    }

    isAutoStartingRef.current = true;
    setStatusError(null);

    void startRecording().finally(() => {
      isAutoStartingRef.current = false;
    });
  }, [autoRecord, hasRecording, isProcessing, isRecording, router, startRecording]);

  async function handleMicPress() {
    if (isProcessing || hasRecording) return;

    setStatusError(null);

    if (isRecording) {
      await stopRecording();
      return;
    }

    await startRecording();
  }

  async function sendVoiceUri(audioUri: string) {
    try {
      setStatusError(null);
      await sendVoiceMessage(audioUri);
    } catch {
      setStatusError('No se pudo procesar el audio. Intenta de nuevo.');
    } finally {
      reset();
    }
  }

  async function handleSendRecording() {
    if (!uri || isProcessing) return;
    await sendVoiceUri(uri);
  }

  function handleDeleteRecording() {
    if (isProcessing) return;
    setStatusError(null);
    setIsPlayingReview(false);
    reset();
  }

  async function handleRepeatRecording() {
    if (isProcessing) return;
    setStatusError(null);
    reset();
    await startRecording();
  }

  async function handleSendText() {
    const text = input.trim();
    if (!text || !canSendText) return;
    setInput('');
    setStatusError(null);
    await sendTextMessage(text);
  }

  const statusLabel = statusError
    ? statusError
    : isListening
      ? `${APP_NAME} está escuchando...`
      : showReview
        ? null
        : showBusy
          ? processingStep === 'transcribing' || processingStep === 'uploading'
            ? 'Procesando tu audio...'
            : 'Organizando...'
          : 'Toca el micrófono para hablar';

  return (
    <ScreenSafeArea edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-5 pb-8 pt-2"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="mb-5 flex-row items-center gap-2.5">
            <View
              className="h-9 w-9 items-center justify-center overflow-hidden rounded-full"
              style={{
                backgroundColor: APP_SURFACE_SOFT,
                borderColor: APP_BORDER,
                borderWidth: 1,
              }}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 36, height: 36 }}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={16} color={APP_ACCENT} />
              )}
            </View>
            <Text className="text-[20px] font-bold" style={{ color: APP_ACCENT }}>
              {APP_NAME}
            </Text>
          </View>

          <View className="flex-1 items-center justify-center gap-5 py-4">
            <View className="items-center gap-2 px-2">
              <Text className="text-center text-[26px] font-bold leading-9 text-white">
                ¿Qué necesitas recordar?
              </Text>
              {statusLabel ? (
                <Text
                  className="text-center text-[14px]"
                  style={{ color: statusError ? '#F87171' : APP_ACCENT }}>
                  {statusLabel}
                </Text>
              ) : null}
            </View>

            <VoiceWaveform active={isListening || showBusy || isPlayingReview} />

            {showReview && uri ? (
              <VoiceReviewControls
                uri={uri}
                disabled={isProcessing}
                onSend={() => void handleSendRecording()}
                onRepeat={() => void handleRepeatRecording()}
                onDelete={handleDeleteRecording}
                onPlayingChange={setIsPlayingReview}
              />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isListening ? 'Detener grabación' : 'Grabar audio'}
                disabled={showBusy}
                onPress={() => void handleMicPress()}
                className="h-[88px] w-[88px] items-center justify-center rounded-full active:opacity-90"
                style={{
                  backgroundColor: APP_ACCENT,
                  opacity: showBusy ? 0.55 : 1,
                  shadowColor: APP_ACCENT,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.45,
                  shadowRadius: 16,
                  elevation: 10,
                }}>
                {showBusy ? (
                  <ActivityIndicator color={APP_ON_ACCENT} />
                ) : (
                  <Ionicons
                    name={isListening ? 'stop' : 'mic'}
                    size={34}
                    color={APP_ON_ACCENT}
                  />
                )}
              </Pressable>
            )}
          </View>

          <View className="mt-2 gap-3">
            <View
              className="flex-row items-center gap-3 rounded-2xl border px-4"
              style={{
                backgroundColor: APP_SURFACE,
                borderColor: APP_BORDER,
                minHeight: 52,
              }}>
              <KeyboardIcon size={18} color={APP_TEXT_MUTED} />
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="O escribe tu tarea aquí..."
                placeholderTextColor={APP_TEXT_MUTED}
                editable={!isProcessing && !isRecording && !hasRecording}
                onSubmitEditing={() => void handleSendText()}
                returnKeyType="send"
                className="flex-1 py-3.5 text-[15px] text-white"
              />
              {canSendText ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Enviar"
                  onPress={() => void handleSendText()}
                  className="h-9 w-9 items-center justify-center rounded-full active:opacity-80"
                  style={{ backgroundColor: APP_ACCENT }}>
                  <Ionicons name="arrow-up" size={18} color={APP_ON_ACCENT} />
                </Pressable>
              ) : null}
            </View>

            <View className="gap-2">
              <Text className="px-0.5 text-[12px]" style={{ color: APP_TEXT_MUTED }}>
                Ejemplos de lo que puedes decir
              </Text>
              {examples.map((example) => (
                <View
                  key={example.id}
                  accessibilityRole="text"
                  className="flex-row items-center gap-3 rounded-2xl border px-3.5 py-3.5"
                  style={{
                    backgroundColor: APP_SURFACE,
                    borderColor: APP_BORDER,
                  }}>
                  <View
                    className="h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: APP_SURFACE_SOFT }}>
                    <Ionicons name={example.icon} size={18} color={APP_ACCENT} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-[11px]" style={{ color: APP_TEXT_MUTED }}>
                      Ejemplo
                    </Text>
                    <Text className="text-[15px] font-medium text-white/90">
                      {example.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
}
