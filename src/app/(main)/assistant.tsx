import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
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

import { VoiceReplyToggle } from '@/components/assistant/voice-reply-toggle';
import { VoiceReviewControls } from '@/components/assistant/voice-review-controls';
import { VoiceSendModeToggle } from '@/components/assistant/voice-send-mode-toggle';
import { VoiceWaveform } from '@/components/assistant/voice-waveform';
import { KeyboardIcon } from '@/components/icons/keyboard-icon';
import { KivoWordmark } from '@/components/kivo-wordmark';
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
import {
  speakAssistantReply,
  spokenReplyDurationMs,
  stopSpokenReply,
} from '@/services/assistant/speak-reply';

export default function AssistantScreen() {
  const router = useRouter();
  const { autoRecord } = useLocalSearchParams<{ autoRecord?: string }>();
  const { user } = useAuth();
  const { preferredName, autoSendVoice, setAutoSendVoice, voiceReplyEnabled, setVoiceReplyEnabled } =
    useUserPreferences();
  const { sendTextMessage, sendVoiceMessage, isProcessing, processingStep } = useAssistant();
  const { isRecording, hasRecording, uri, error, startRecording, stopRecording, reset, clearError } =
    useVoiceRecorder();

  const displayName = preferredName.trim() || user?.name?.split(' ')[0] || '';
  const headline = displayName ? `¿Qué necesitas ${displayName}?` : '¿Qué necesitas?';
  const [input, setInput] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [resultFeedback, setResultFeedback] = useState<string | null>(null);
  const [isPlayingReview, setIsPlayingReview] = useState(false);
  const [examples, setExamples] = useState<VoiceExample[]>(() => pickVoiceExamples());
  const isAutoStartingRef = useRef(false);
  const autoSendInFlightUriRef = useRef<string | null>(null);
  const feedbackClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSendText = input.trim().length > 0 && !isProcessing && !isRecording;
  const isListening = isRecording;
  const showBusy = isProcessing && !isListening;
  // Keep review UI visible while a text/audio request is processing so the user can send the other next.
  const showReview = hasRecording && !!uri && !autoSendVoice;

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackClearTimerRef.current) {
      clearTimeout(feedbackClearTimerRef.current);
      feedbackClearTimerRef.current = null;
    }
  }, []);

  const showResultFeedback = useCallback(
    (reply: string) => {
      clearFeedbackTimer();
      setResultFeedback(reply);
      if (voiceReplyEnabled) {
        speakAssistantReply(reply);
      }
      feedbackClearTimerRef.current = setTimeout(() => {
        setResultFeedback(null);
        feedbackClearTimerRef.current = null;
      }, voiceReplyEnabled ? spokenReplyDurationMs(reply) : 4500);
    },
    [clearFeedbackTimer, voiceReplyEnabled],
  );

  useFocusEffect(
    useCallback(() => {
      setExamples(pickVoiceExamples());
      return () => {
        clearFeedbackTimer();
        setResultFeedback(null);
        setStatusError(null);
        clearError();
        stopSpokenReply();
      };
    }, [clearFeedbackTimer, clearError]),
  );

  useEffect(() => {
    return () => {
      clearFeedbackTimer();
      stopSpokenReply();
    };
  }, [clearFeedbackTimer]);

  useEffect(() => {
    setStatusError(error);
  }, [error]);

  useEffect(() => {
    if (!autoSendVoice || !hasRecording || !uri || isProcessing || isRecording) return;
    if (autoSendInFlightUriRef.current === uri) return;

    autoSendInFlightUriRef.current = uri;
    setStatusError(null);
    clearFeedbackTimer();
    setResultFeedback(null);

    void sendVoiceMessage(uri)
      .then((reply) => {
        if (reply) showResultFeedback(reply);
      })
      .catch(() => {
        setStatusError('No se pudo procesar el audio. Intenta de nuevo.');
      })
      .finally(() => {
        if (autoSendInFlightUriRef.current === uri) {
          autoSendInFlightUriRef.current = null;
        }
        reset();
      });
  }, [
    autoSendVoice,
    hasRecording,
    uri,
    isProcessing,
    isRecording,
    sendVoiceMessage,
    reset,
    clearFeedbackTimer,
    showResultFeedback,
  ]);

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
    clearFeedbackTimer();
    setResultFeedback(null);
    stopSpokenReply();

    if (isRecording) {
      await stopRecording();
      return;
    }

    await startRecording();
  }

  async function sendVoiceUri(audioUri: string) {
    try {
      setStatusError(null);
      clearFeedbackTimer();
      setResultFeedback(null);
      const reply = await sendVoiceMessage(audioUri);
      if (reply) showResultFeedback(reply);
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
    clearFeedbackTimer();
    setResultFeedback(null);
    setIsPlayingReview(false);
    reset();
  }

  async function handleRepeatRecording() {
    if (isProcessing) return;
    setStatusError(null);
    clearFeedbackTimer();
    setResultFeedback(null);
    reset();
    await startRecording();
  }

  async function handleSendText() {
    const text = input.trim();
    if (!text || !canSendText) return;
    setInput('');
    setStatusError(null);
    clearFeedbackTimer();
    setResultFeedback(null);
    stopSpokenReply();
    try {
      const reply = await sendTextMessage(text);
      if (reply) showResultFeedback(reply);
    } catch {
      setStatusError('No se pudo enviar el mensaje. Intenta de nuevo.');
    }
  }

  const statusLabel = statusError
    ? statusError
    : resultFeedback
      ? resultFeedback
      : isListening
        ? `${APP_NAME} está escuchando...`
        : showBusy
          ? processingStep === 'transcribing' || processingStep === 'uploading'
            ? 'Procesando tu audio...'
            : 'Organizando...'
          : showReview
            ? null
            : autoSendVoice
              ? 'Toca el micrófono. Se enviará al detener.'
              : 'Toca el micrófono para hablar';

  const statusColor = statusError ? '#F87171' : resultFeedback ? '#2DD4BF' : APP_ACCENT;
  const modeToggleDisabled = isProcessing || isRecording;

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
          <View className="mb-4 gap-3">
            <KivoWordmark size={22} />
            <VoiceSendModeToggle
              autoSend={autoSendVoice}
              disabled={modeToggleDisabled}
              onChange={(next) => {
                setStatusError(null);
                clearError();
                void setAutoSendVoice(next);
              }}
            />
            <VoiceReplyToggle
              enabled={voiceReplyEnabled}
              disabled={modeToggleDisabled}
              onChange={(next) => {
                setStatusError(null);
                if (!next) stopSpokenReply();
                void setVoiceReplyEnabled(next);
              }}
            />
            {voiceReplyEnabled ? (
              <Text className="self-center text-center text-[11px] leading-4" style={{ color: APP_TEXT_MUTED }}>
                El teléfono lee la respuesta. Eso no gasta tokens. El audio que envías sí usa Whisper e IA.
              </Text>
            ) : null}
          </View>

          <View className="flex-1 items-center justify-center gap-5 py-4">
            <View className="items-center gap-2 px-2">
              <Text className="text-center text-[26px] font-bold leading-9 text-white">
                {headline}
              </Text>
              {statusLabel ? (
                <Text className="text-center text-[14px] leading-5" style={{ color: statusColor }}>
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
                onChangeText={(text) => {
                  setStatusError(null);
                  clearError();
                  setInput(text);
                }}
                onFocus={() => {
                  setStatusError(null);
                  clearError();
                }}
                placeholder="O escribe tu tarea aquí..."
                placeholderTextColor={APP_TEXT_MUTED}
                editable={!isRecording}
                onSubmitEditing={() => void handleSendText()}
                returnKeyType="send"
                className="flex-1 py-3.5 text-[15px] text-white"
              />
              {input.trim().length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Enviar"
                  disabled={!canSendText}
                  onPress={() => void handleSendText()}
                  className="h-9 w-9 items-center justify-center rounded-full active:opacity-80"
                  style={{
                    backgroundColor: APP_ACCENT,
                    opacity: canSendText ? 1 : 0.45,
                  }}>
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
