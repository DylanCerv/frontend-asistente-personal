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
  const [savedRating, setSavedRating] = useState(0);
  const [savedComment, setSavedComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const loadExisting = useCallback(async () => {
    setIsLoading(true);
    try {
      const existing = await getMyFeedback();
      if (existing) {
        const nextComment = existing.comment ?? '';
        setRating(existing.rating);
        setComment(nextComment);
        setSavedRating(existing.rating);
        setSavedComment(nextComment);
        setHasSaved(true);
        setExpanded(false);
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

  const trimmedComment = comment.trim();
  const hasChanges =
    !hasSaved || rating !== savedRating || trimmedComment !== savedComment.trim();

  async function handleSubmit() {
    if (rating < 1 || rating > 5 || isSubmitting || !hasChanges) return;

    setIsSubmitting(true);
    try {
      const wasUpdate = hasSaved;
      await submitFeedback({
        rating,
        comment: trimmedComment,
        app_version: APP_VERSION,
      });
      setComment(trimmedComment);
      setSavedRating(rating);
      setSavedComment(trimmedComment);
      setHasSaved(true);
      setExpanded(false);
      showAppAlert(
        '¡Gracias!',
        wasUpdate ? 'Actualizamos tu opinión.' : 'Recibimos tu calificación.',
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

  const canSubmit = rating >= 1 && hasChanges && !isSubmitting && !isLoading;
  const showForm = !hasSaved || expanded;

  if (isLoading) {
    return (
      <View
        className="items-center justify-center rounded-2xl px-4 py-4"
        style={{ backgroundColor: APP_SURFACE, borderWidth: 1, borderColor: APP_BORDER }}>
        <ActivityIndicator color={APP_ACCENT} />
      </View>
    );
  }

  if (!showForm) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Editar tu opinión"
        onPress={() => setExpanded(true)}
        className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5 active:opacity-85"
        style={{ backgroundColor: APP_SURFACE, borderWidth: 1, borderColor: APP_BORDER }}>
        <Ionicons name="checkmark-circle" size={20} color={APP_ACCENT} />
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-[14px] font-semibold text-foreground">Gracias por tu opinión</Text>
          <View className="flex-row items-center gap-1">
            {Array.from({ length: STAR_COUNT }, (_, index) => {
              const selected = index + 1 <= rating;
              return (
                <Ionicons
                  key={index}
                  name={selected ? 'star' : 'star-outline'}
                  size={12}
                  color={selected ? APP_ACCENT : APP_TEXT_MUTED}
                />
              );
            })}
            <Text className="ml-1 text-[11px]" style={{ color: APP_TEXT_MUTED }}>
              Toca para editar
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={16} color={APP_TEXT_MUTED} />
      </Pressable>
    );
  }

  return (
    <View
      className="gap-4 rounded-2xl p-5"
      style={{ backgroundColor: APP_SURFACE, borderWidth: 1, borderColor: APP_BORDER }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Ionicons name="star-outline" size={18} color={APP_ACCENT} />
            <Text className="text-base font-bold text-foreground">Tu opinión</Text>
          </View>
          <Text className="text-sm leading-5" style={{ color: APP_TEXT_MUTED }}>
            Califica la app de 1 a 5 estrellas. Tu feedback nos ayuda a mejorar.
          </Text>
        </View>
        {hasSaved ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar formulario de opinión"
            onPress={() => setExpanded(false)}
            hitSlop={8}
            className="active:opacity-70">
            <Ionicons name="chevron-up" size={18} color={APP_TEXT_MUTED} />
          </Pressable>
        ) : null}
      </View>

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
    </View>
  );
}
