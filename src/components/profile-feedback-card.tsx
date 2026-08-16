import Ionicons from '@react-native-vector-icons/ionicons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  APP_ACCENT,
  APP_BORDER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import { APP_VERSION } from '@/constants/branding';
import { showAppAlert } from '@/services/app-dialog';
import { getMyFeedback, submitFeedback } from '@/services/feedback/feedback-api';

const STAR_COUNT = 5;
const COMMENT_MAX = 1000;

export function ProfileFeedbackCard() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const loadExisting = useCallback(async () => {
    setIsLoading(true);
    try {
      const existing = await getMyFeedback();
      if (existing) {
        setRating(existing.rating);
        setComment(existing.comment ?? '');
        setHasSaved(true);
      }
    } catch {
      // Keep empty form if feedback can't be loaded yet (e.g. table not migrated).
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  async function handleSubmit() {
    if (rating < 1 || rating > 5 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        rating,
        comment: comment.trim(),
        app_version: APP_VERSION,
      });
      setHasSaved(true);
      showAppAlert(
        '¡Gracias!',
        hasSaved ? 'Actualizamos tu opinión.' : 'Recibimos tu calificación.',
      );
    } catch (error) {
      showAppAlert(
        'No se pudo enviar',
        error instanceof Error ? error.message : 'Intenta de nuevo en un momento.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = rating >= 1 && !isSubmitting && !isLoading;

  return (
    <View
      className="gap-4 rounded-2xl p-5"
      style={{ backgroundColor: APP_SURFACE, borderWidth: 1, borderColor: APP_BORDER }}>
      <View className="gap-1">
        <View className="flex-row items-center gap-2">
          <Ionicons name="star-outline" size={18} color={APP_ACCENT} />
          <Text className="text-base font-bold text-foreground">Tu opinión</Text>
        </View>
        <Text className="text-sm leading-5" style={{ color: APP_TEXT_MUTED }}>
          Califica la app de 1 a 5 estrellas. Tu feedback nos ayuda a mejorar.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={APP_ACCENT} />
      ) : (
        <>
          <View className="flex-row items-center justify-center gap-2">
            {Array.from({ length: STAR_COUNT }, (_, index) => {
              const value = index + 1;
              const selected = value <= rating;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={`${value} estrella${value === 1 ? '' : 's'}`}
                  accessibilityState={{ selected }}
                  onPress={() => setRating(value)}
                  hitSlop={6}
                  className="active:opacity-80">
                  <Ionicons
                    name={selected ? 'star' : 'star-outline'}
                    size={28}
                    color={selected ? APP_ACCENT : APP_TEXT_MUTED}
                  />
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={comment}
            onChangeText={(text) => setComment(text.slice(0, COMMENT_MAX))}
            placeholder="Cuéntanos qué te gusta o qué mejorarías (opcional)"
            placeholderTextColor={APP_TEXT_MUTED}
            multiline
            textAlignVertical="top"
            maxLength={COMMENT_MAX}
            className="min-h-[88px] rounded-xl border px-3.5 py-3 text-[14px] text-white"
            style={{ borderColor: APP_BORDER, backgroundColor: 'rgba(255,255,255,0.03)' }}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hasSaved ? 'Actualizar opinión' : 'Enviar opinión'}
            disabled={!canSubmit}
            onPress={() => void handleSubmit()}
            className="min-h-[48px] items-center justify-center rounded-2xl active:opacity-90"
            style={{
              backgroundColor: APP_ACCENT,
              opacity: canSubmit ? 1 : 0.55,
            }}>
            {isSubmitting ? (
              <ActivityIndicator color={APP_ON_ACCENT} />
            ) : (
              <Text className="text-[15px] font-bold" style={{ color: APP_ON_ACCENT }}>
                {hasSaved ? 'Actualizar opinión' : 'Enviar opinión'}
              </Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}
