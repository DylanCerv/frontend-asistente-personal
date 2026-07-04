import Ionicons from '@react-native-vector-icons/ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import {
  setAppDialogListener,
  type AppDialogButton,
  type AppDialogPayload,
} from '@/services/app-dialog';

function resolveDialogTone(payload: AppDialogPayload): {
  icon: ComponentProps<typeof Ionicons>['name'];
  accent: string;
} {
  const text = `${payload.title} ${payload.message ?? ''}`.toLowerCase();
  if (payload.buttons?.some((button) => button.style === 'destructive')) {
    return { icon: 'trash-outline', accent: '#DC2626' };
  }
  if (text.includes('error') || text.includes('no se pudo') || text.includes('requerido')) {
    return { icon: 'alert-circle-outline', accent: '#DC2626' };
  }
  return { icon: 'checkmark-circle-outline', accent: '#7C3AED' };
}

export function AppDialogHost() {
  const [payload, setPayload] = useState<AppDialogPayload | null>(null);

  useEffect(() => {
    setAppDialogListener(setPayload);
    return () => setAppDialogListener(null);
  }, []);

  const actions = useMemo<AppDialogButton[]>(() => {
    if (!payload) return [];
    return payload.buttons?.length ? payload.buttons : [{ text: 'Entendido', style: 'default' }];
  }, [payload]);

  if (!payload) return null;

  const tone = resolveDialogTone(payload);

  function closeWithAction(action?: AppDialogButton) {
    setPayload(null);
    action?.onPress?.();
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setPayload(null)}>
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <View className="w-full max-w-sm overflow-hidden rounded-[32px] border border-white/40 bg-white shadow-lg dark:border-white/10 dark:bg-surface-dark">
          <LinearGradient
            colors={['rgba(124,58,237,0.18)', 'rgba(255,255,255,0.00)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0"
          />

          <View className="items-center gap-4 px-6 pb-5 pt-7">
            <View
              className="h-14 w-14 items-center justify-center rounded-2xl bg-surface-soft dark:bg-surface-soft-dark"
              style={{ borderColor: tone.accent, borderWidth: 1 }}>
              <Ionicons name={tone.icon} size={30} color={tone.accent} />
            </View>

            <View className="items-center gap-2">
              <Text className="text-center text-xl font-bold text-foreground dark:text-foreground-dark">
                {payload.title}
              </Text>
              {payload.message ? (
                <Text className="text-center text-sm leading-6 text-subtle dark:text-subtle-dark">
                  {payload.message}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="gap-2 border-t border-border/70 bg-canvas px-4 py-4 dark:border-border-dark dark:bg-canvas-dark">
            {actions.map((action, index) => {
              const isCancel = action.style === 'cancel';
              const isDestructive = action.style === 'destructive';
              const isPrimary = !isCancel && !isDestructive && index === actions.length - 1;

              return (
                <Pressable
                  key={`${action.text}-${index}`}
                  accessibilityRole="button"
                  onPress={() => closeWithAction(action)}
                  className={`min-h-[50px] items-center justify-center rounded-2xl active:opacity-85 ${
                    isPrimary
                      ? 'bg-brand dark:bg-brand-dark'
                      : 'border border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
                  }`}>
                  <Text
                    className={`text-base font-semibold ${
                      isPrimary
                        ? 'text-white'
                        : isDestructive
                          ? 'text-danger dark:text-danger-dark'
                          : 'text-foreground dark:text-foreground-dark'
                    }`}>
                    {action.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
